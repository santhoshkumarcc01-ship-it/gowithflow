import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function safeJsonParse(val: any, fallback: any) {
  if (typeof val !== 'string') return val ?? fallback;
  try {
    return JSON.parse(val);
  } catch {
    return typeof fallback === 'object' && Array.isArray(fallback)
      ? val.split(',').map((s: string) => s.trim()).filter(Boolean)
      : fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Check for Supabase Auth token
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && isSupabaseConfigured) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        const [
          sbProfile,
          sbPreferences,
          sbInterests,
          sbSkills,
          sbCertifications,
          sbProjects,
          sbCareerGoals,
          sbRoadmaps,
          sbResources,
          sbAssessments,
          sbScoringReports,
          sbProgress
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('learner_preferences').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('learner_interests').select('*').eq('user_id', user.id),
          supabase.from('learner_skills').select('*').eq('user_id', user.id),
          supabase.from('certifications').select('*').eq('user_id', user.id),
          supabase.from('projects').select('*').eq('user_id', user.id),
          supabase.from('career_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('learning_roadmaps').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }),
          supabase.from('learning_resources').select('*').eq('user_id', user.id),
          supabase.from('assessments').select('*').eq('user_id', user.id),
          supabase.from('scoring_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('learner_progress').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        if (sbProfile.data) {
          const profile = sbProfile.data;
          const currentGoal = (sbCareerGoals.data || []).find((g: any) => g.goal_status === 'active') || sbCareerGoals.data?.[0] || null;
          const currentRoadmap = (sbRoadmaps.data || []).find((r: any) => r.status === 'active') || sbRoadmaps.data?.[0] || null;
          const latestScoring = sbScoringReports.data?.[0] || null;

          return NextResponse.json({
            success: true,
            data: {
              profile: {
                id: profile.id,
                fullName: profile.full_name,
                email: profile.email,
                institution: profile.institution,
                department: profile.department,
                educationLevel: profile.education_level,
                graduationYear: profile.graduation_year,
                linkedinUrl: profile.linkedin_url,
                githubUrl: profile.github_url,
                portfolioUrl: profile.portfolio_url,
                profileCompletion: profile.profile_completion,
                onboardingStatus: profile.onboarding_status
              },
              preferences: sbPreferences.data ? {
                weeklyHours: sbPreferences.data.weekly_learning_hours,
                learningStyle: sbPreferences.data.learning_style,
                budgetPreference: sbPreferences.data.budget_preference,
                preferredLanguage: sbPreferences.data.preferred_language,
                notificationEnabled: sbPreferences.data.notification_enabled
              } : null,
              interests: sbInterests.data || [],
              skills: (sbSkills.data || []).map((s: any) => ({
                id: s.id,
                skillName: s.skill_name,
                category: s.category,
                proficiency: s.proficiency_level,
                selfAssessedScore: s.self_assessed_score,
                evidenceSource: s.evidence_source,
                evidenceDescription: s.evidence_description
              })),
              certifications: (sbCertifications.data || []).map((c: any) => ({
                id: c.id,
                certificationName: c.certification_name,
                issuingOrg: c.issuing_organization,
                credentialId: c.credential_id,
                credentialUrl: c.credential_url,
                issueDate: c.issue_date,
                expiryDate: c.expiry_date,
                documentPath: c.document_path
              })),
              projects: (sbProjects.data || []).map((p: any) => ({
                id: p.id,
                projectName: p.project_name,
                description: p.description,
                projectCategory: p.project_category,
                technologies: p.technologies,
                githubUrl: p.github_url,
                deploymentUrl: p.deployment_url,
                role: p.role,
                projectType: p.project_type,
                outcomes: p.outcomes
              })),
              careerGoals: (sbCareerGoals.data || []).map((g: any) => ({
                id: g.id,
                primaryRole: g.target_role,
                secondaryRole: g.secondary_role,
                preferredIndustry: g.preferred_industry,
                targetDate: g.target_timeline,
                reason: g.motivation,
                confidenceLevel: g.confidence_level,
                isCurrent: g.goal_status === 'active'
              })),
              currentCareerGoal: currentGoal ? {
                id: currentGoal.id,
                primaryRole: currentGoal.target_role,
                secondaryRole: currentGoal.secondary_role,
                preferredIndustry: currentGoal.preferred_industry,
                targetDate: currentGoal.target_timeline,
                reason: currentGoal.motivation,
                confidenceLevel: currentGoal.confidence_level,
                isCurrent: true
              } : null,
              roadmaps: (sbRoadmaps.data || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                description: r.description,
                durationWeeks: r.duration_weeks,
                phases: safeJsonParse((r.roadmap_data as any)?.generatedMilestones || r.roadmap_data, [])
              })),
              currentRoadmap: currentRoadmap ? {
                id: currentRoadmap.id,
                title: currentRoadmap.title,
                description: currentRoadmap.description,
                durationWeeks: currentRoadmap.duration_weeks,
                phases: safeJsonParse((currentRoadmap.roadmap_data as any)?.generatedMilestones || currentRoadmap.roadmap_data, [])
              } : null,
              resources: sbResources.data || [],
              assessments: sbAssessments.data || [],
              scoringReports: (sbScoringReports.data || []).map((s: any) => ({
                id: s.id,
                overallScore: s.overall_score,
                technicalSkillsScore: s.skill_score,
                projectScore: s.project_score,
                certificationScore: s.certification_score,
                portfolioScore: s.portfolio_score,
                careerPreparationScore: s.career_preparation_score,
                strengths: (s.report_data as any)?.strengths || [],
                weaknesses: (s.report_data as any)?.weaknesses || [],
                improvementPlan: (s.report_data as any)?.improvementPlan || []
              })),
              latestScoringReport: latestScoring ? {
                id: latestScoring.id,
                overallScore: latestScoring.overall_score,
                technicalSkillsScore: latestScoring.skill_score,
                projectScore: latestScoring.project_score,
                certificationScore: latestScoring.certification_score,
                portfolioScore: latestScoring.portfolio_score,
                careerPreparationScore: latestScoring.career_preparation_score,
                strengths: (latestScoring.report_data as any)?.strengths || [],
                weaknesses: (latestScoring.report_data as any)?.weaknesses || [],
                improvementPlan: (latestScoring.report_data as any)?.improvementPlan || []
              } : null,
              progress: sbProgress.data ? {
                percentage: sbProgress.data.progress_percentage,
                status: sbProgress.data.completion_status
              } : null
            }
          });
        }
      }
    }

    // 2. Fallback to local session
    const session = await getSession();
    const userId = session?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in to view your dashboard.' }, { status: 401 });
    }

    const [
      profile,
      preferences,
      interests,
      skills,
      certifications,
      projects,
      careerGoals,
      roadmaps,
      resources,
      assessments,
      scoringReports,
      progress
    ] = await Promise.all([
      prisma.learnerProfile.findUnique({ where: { userId } }),
      prisma.learnerPreference.findUnique({ where: { userId } }),
      prisma.learnerInterest.findMany({ where: { userId } }),
      prisma.learnerSkillItem.findMany({ where: { userId } }),
      prisma.learnerCertification.findMany({ where: { userId } }),
      prisma.learnerProject.findMany({ where: { userId } }),
      prisma.learnerCareerGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.learningRoadmap.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.learningResource.findMany({ where: { userId } }),
      prisma.learnerAssessment.findMany({ where: { userId } }),
      prisma.scoringReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.learnerProgressItem.findUnique({ where: { userId } })
    ]);

    // Parse JSON strings safely
    const parsedRoadmaps = roadmaps.map(r => ({
      ...r,
      phases: safeJsonParse(r.phases, [])
    }));

    const parsedScoringReports = scoringReports.map(s => ({
      ...s,
      strengths: safeJsonParse(s.strengths, []),
      weaknesses: safeJsonParse(s.weaknesses, []),
      improvementPlan: safeJsonParse(s.improvementPlan, [])
    }));

    const parsedProjects = projects.map(p => ({
      ...p,
      technologies: safeJsonParse(p.technologies, [])
    }));

    return NextResponse.json({
      success: true,
      data: {
        profile,
        preferences,
        interests,
        skills,
        certifications,
        projects: parsedProjects,
        careerGoals,
        currentCareerGoal: careerGoals.find(g => g.isCurrent) || careerGoals[0] || null,
        roadmaps: parsedRoadmaps,
        currentRoadmap: parsedRoadmaps[0] || null,
        resources,
        assessments,
        scoringReports: parsedScoringReports,
        latestScoringReport: parsedScoringReports[0] || null,
        progress
      }
    });
  } catch (error: any) {
    console.error('[GoWithFlow Overview Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
