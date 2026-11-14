import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, getAuthenticatedUser } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AIService } from '@/lib/ai';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    let userId = authUser?.id;
    let supabaseUserId: string | null = authUser?.source === 'supabase' ? authUser.id : null;

    // Also check for Supabase JWT bearer token
    if (!supabaseUserId && isSupabaseConfigured) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: { user: null } }));
        if (user) {
          supabaseUserId = user.id;
          if (!userId) userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { agentType, payload } = await req.json();

    if (!agentType || !['WF-01_SUGGESTION', 'WF-02_SCORING'].includes(agentType)) {
      return NextResponse.json({ success: false, error: 'Valid agentType required (WF-01_SUGGESTION | WF-02_SCORING).' }, { status: 400 });
    }

    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Fetch authorized student context
    const [profile, skills, projects, certs, goal] = await Promise.all([
      prisma.learnerProfile.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerSkillItem.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerProject.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerCertification.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerCareerGoal.findFirst({ where: { userId, isCurrent: true } }).catch(() => null)
    ]);

    const targetRole = payload?.targetRole || goal?.primaryRole || 'Full Stack Developer';
    let outputData: any = {};

    if (agentType === 'WF-01_SUGGESTION') {
      // WF-01 Suggestion Agent: Real-time Gemini career matching, skill gaps, & roadmap generation
      outputData = await AIService.runSuggestionAgent({
        learnerName: profile?.fullName || authUser?.name || 'Learner',
        targetRole,
        skills: (skills || []).map(s => s.skillName),
        projects: (projects || []).map(p => ({
          name: p.name,
          description: p.description,
          technologies: typeof p.technologies === 'string' ? p.technologies : JSON.stringify(p.technologies)
        })),
        certifications: (certs || []).map(c => c.name),
        department: profile?.department || undefined || undefined,
        educationLevel: profile?.educationLevel || undefined
      });

      // Persist roadmap locally
      if (userId) {
        await prisma.learningRoadmap.create({
          data: {
            userId,
            targetRole,
            title: `${targetRole} Accelerated Track`,
            description: `Live AI-generated personalized trajectory by GoWithFlow Learning Pathway Agent targeting ${targetRole}.`,
            phases: JSON.stringify(outputData.roadmapPhases)
          }
        }).catch(() => {});
      }

      // Persist to Supabase if user authenticated
      if (supabaseUserId && isSupabaseConfigured) {
        try {
          await supabase.from('learning_roadmaps').insert({
            user_id: supabaseUserId,
            title: `${targetRole} Accelerated Track`,
            description: `Live AI-generated personalized trajectory by GoWithFlow Learning Pathway Agent targeting ${targetRole}.`,
            duration_weeks: 12,
            roadmap_data: outputData,
            status: 'active'
          });

          for (const resItem of outputData.recommendedResources) {
            await supabase.from('learning_resources').insert({
              user_id: supabaseUserId,
              resource_title: resItem.title,
              skill_name: outputData.missingSkills[0] || 'Core Stack',
              provider: resItem.provider,
              resource_url: resItem.url,
              estimated_hours: resItem.estimatedHours,
              pricing: resItem.isFree ? 'Free' : 'Paid',
              status: 'recommended'
            });
          }
        } catch (sbErr) {
          console.warn('[Supabase Roadmap Insert Warning]:', sbErr);
        }
      }

    } else {
      // WF-02 Scoring Agent: Real-time Gemini evaluation of skills, projects, certifications, portfolio, readiness
      outputData = await AIService.runScoringAgent({
        learnerName: profile?.fullName || authUser?.name || 'Learner',
        targetRole,
        skills: (skills || []).map(s => s.skillName),
        projects: (projects || []).map(p => ({
          name: p.name,
          description: p.description,
          technologies: typeof p.technologies === 'string' ? p.technologies : JSON.stringify(p.technologies)
        })),
        certifications: (certs || []).map(c => c.name),
        portfolioUrl: profile?.portfolioUrl || '',
        githubUrl: profile?.githubUrl || '',
        department: profile?.department || undefined
      });

      // Persist the scoring report locally
      if (userId) {
        await prisma.scoringReport.create({
          data: {
            userId,
            overallScore: outputData.overallScore,
            technicalSkillsScore: outputData.technicalSkillsScore,
            projectScore: outputData.projectScore,
            certificationScore: outputData.certificationScore,
            portfolioScore: outputData.portfolioScore,
            careerPreparationScore: outputData.careerPreparationScore,
            strengths: JSON.stringify(outputData.strengths),
            weaknesses: JSON.stringify(outputData.weaknesses),
            improvementPlan: JSON.stringify(outputData.improvementPlan)
          }
        }).catch(() => {});
      }

      // Persist to Supabase if user authenticated
      if (supabaseUserId && isSupabaseConfigured) {
        try {
          await supabase.from('scoring_reports').insert({
            user_id: supabaseUserId,
            target_role: targetRole,
            overall_score: outputData.overallScore,
            skill_score: outputData.technicalSkillsScore,
            project_score: outputData.projectScore,
            certification_score: outputData.certificationScore,
            portfolio_score: outputData.portfolioScore,
            career_preparation_score: outputData.careerPreparationScore,
            evidence_coverage: 90,
            report_data: outputData
          });
        } catch (sbErr) {
          console.warn('[Supabase Scoring Insert Warning]:', sbErr);
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Record agent run locally
    if (userId) {
      await prisma.agentRun.create({
        data: {
          userId,
          agentType,
          status: 'COMPLETED',
          inputData: JSON.stringify({ targetRole, skillsCount: skills?.length || 0 }),
          outputData: JSON.stringify(outputData),
          executionTime
        }
      }).catch(() => {});
    }

    // Record agent run in Supabase
    if (supabaseUserId && isSupabaseConfigured) {
      try {
        await supabase.from('agent_runs').insert({
          user_id: supabaseUserId,
          request_id: requestId,
          agent_type: agentType,
          status: 'COMPLETED',
          request_data: { targetRole, skillsCount: skills?.length || 0 },
          response_data: outputData,
          created_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString()
        });
      } catch (sbErr) {
        console.warn('[Supabase Agent Run Insert Warning]:', sbErr);
      }
    }

    return NextResponse.json({ success: true, data: outputData });
  } catch (error: any) {
    console.error('[SkillPath Agent Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
