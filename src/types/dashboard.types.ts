import type { 
  Profile, 
  LearnerPreference, 
  LearnerSkill, 
  Certification, 
  Project, 
  CareerGoal, 
  LearningRoadmap, 
  ScoringReport, 
  LearnerProgress 
} from './learner.types';

export type DashboardTab = 
  | 'OVERVIEW' 
  | 'AI_MENTOR'
  | 'PROFILE' 
  | 'SKILLS' 
  | 'CERTIFICATIONS' 
  | 'PROJECTS' 
  | 'CAREER_GOALS' 
  | 'ROADMAP' 
  | 'PROGRESS' 
  | 'EVALUATION' 
  | 'ATTENDANCE' 
  | 'MATERIALS' 
  | 'ASSIGNMENTS' 
  | 'CONNECTIONS';

export interface DashboardOverviewData {
  profile: Profile | null;
  preferences: LearnerPreference | null;
  skills: LearnerSkill[];
  certifications: Certification[];
  projects: Project[];
  currentCareerGoal: CareerGoal | null;
  careerGoals: CareerGoal[];
  currentRoadmap: LearningRoadmap | null;
  roadmaps: LearningRoadmap[];
  latestScoringReport: ScoringReport | null;
  scoringReports: ScoringReport[];
  progress: LearnerProgress | null;
  metrics: {
    totalSkills: number;
    totalCertifications: number;
    totalProjects: number;
    readinessScore: number;
    profileCompletion: number;
  };
}
