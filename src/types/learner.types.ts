import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type LearnerPreference = Database['public']['Tables']['learner_preferences']['Row'];
export type LearnerPreferenceInsert = Database['public']['Tables']['learner_preferences']['Insert'];

export type LearnerInterest = Database['public']['Tables']['learner_interests']['Row'];
export type LearnerInterestInsert = Database['public']['Tables']['learner_interests']['Insert'];

export type LearnerSkill = Database['public']['Tables']['learner_skills']['Row'];
export type LearnerSkillInsert = Database['public']['Tables']['learner_skills']['Insert'];
export type LearnerSkillUpdate = Database['public']['Tables']['learner_skills']['Update'];

export type Certification = Database['public']['Tables']['certifications']['Row'];
export type CertificationInsert = Database['public']['Tables']['certifications']['Insert'];
export type CertificationUpdate = Database['public']['Tables']['certifications']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type CareerGoal = Database['public']['Tables']['career_goals']['Row'];
export type CareerGoalInsert = Database['public']['Tables']['career_goals']['Insert'];
export type CareerGoalUpdate = Database['public']['Tables']['career_goals']['Update'];

export type LearningRoadmap = Database['public']['Tables']['learning_roadmaps']['Row'];
export type LearningRoadmapInsert = Database['public']['Tables']['learning_roadmaps']['Insert'];

export type LearningResource = Database['public']['Tables']['learning_resources']['Row'];
export type LearningResourceInsert = Database['public']['Tables']['learning_resources']['Insert'];

export type Assessment = Database['public']['Tables']['assessments']['Row'];
export type ScoringReport = Database['public']['Tables']['scoring_reports']['Row'];
export type AgentRun = Database['public']['Tables']['agent_runs']['Row'];
export type LearnerProgress = Database['public']['Tables']['learner_progress']['Row'];

export interface OnboardingData {
  profile: {
    fullName: string;
    institution?: string;
    department?: string;
    educationLevel?: string;
    graduationYear?: number;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  };
  preferences: {
    weeklyLearningHours: number;
    learningStyle?: string;
    budgetPreference?: string;
    preferredLanguage?: string;
  };
  interests: Array<{
    interestName: string;
    category?: string;
  }>;
  skills: Array<{
    skillName: string;
    category?: string;
    proficiencyLevel: string;
    selfAssessedScore?: number;
    evidenceSource?: string;
    evidenceDescription?: string;
  }>;
  certifications: Array<{
    certificationName: string;
    issuingOrganization?: string;
    credentialId?: string;
    credentialUrl?: string;
    issueDate?: string;
    expiryDate?: string;
    documentPath?: string;
  }>;
  projects: Array<{
    projectName: string;
    description?: string;
    projectCategory?: string;
    technologies?: string[];
    githubUrl?: string;
    deploymentUrl?: string;
    role?: string;
    projectType?: string;
    outcomes?: string;
    attachmentPath?: string;
  }>;
  careerGoal: {
    targetRole: string;
    secondaryRole?: string;
    preferredIndustry?: string;
    targetTimeline?: string;
    motivation?: string;
    confidenceLevel?: number;
  };
}
