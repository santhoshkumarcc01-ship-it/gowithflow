export * from './auth.service';
export * from './profile.service';
export * from './preferences.service';
export * from './skills.service';
export * from './interests.service';
export * from './certifications.service';
export * from './projects.service';
export * from './career-goals.service';
export * from './roadmap.service';
export * from './resources.service';
export * from './assessments.service';
export * from './reports.service';
export * from './progress.service';
export * from './agent.service';
export * from './storage.service';
export * from './onboarding.service';

// Re-export alias for legacy backward compatibility
export { careerGoalsService as careerService } from './career-goals.service';

// Mentor, Tracker and Chat services
export { mentorService } from './mentor.service';
export { trackerService } from './tracker.service';
export { chatService } from './chat.service';
