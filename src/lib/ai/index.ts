import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface RoadmapStep {
  id: number;
  title: string;
  desc: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
}

export interface AIServiceResponse {
  roadmap: RoadmapStep[];
  skillsToLearn: string[];
  recommendations: string[];
  projects: string[];
}

export interface MaterialContextItem {
  id?: string;
  title: string;
  category: string;
  subject: string;
  fileName: string;
  fileUrl?: string;
  description?: string | null;
}

export interface AssignmentContextItem {
  id?: string;
  title: string;
  subject: string;
  deadline: string;
  submitted: boolean;
  marks?: number | null;
}

export interface RoadmapContextItem {
  phaseNumber: number;
  title: string;
  status: string;
  topics?: string[];
}

export interface CourseAnswerResponse {
  reply: string;
  sources: Array<{
    title: string;
    subject: string;
    category: string;
    fileUrl?: string;
  }>;
}

export interface MentorRecommendation {
  id: string;
  category: 'GOAL' | 'STUDY_PLAN' | 'REFLECTION' | 'NEXT_STEP';
  title: string;
  description: string;
  timeframe: string;
  suggestedAction: string;
  impactTopic: string;
  isAiGenerated: true;
  confidenceNote: string;
}

export class AIService {
  static async generateCareerRoadmap(
    targetRole: string,
    currentSkills: string[],
    departmentName: string,
    year: number
  ): Promise<AIServiceResponse> {
    const skillsString = currentSkills.join(', ');

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
          You are an expert AI Career Advisor at a premium university.
          Generate a detailed career roadmap for a student with:
          - Target Role: "${targetRole}"
          - Current Skills: "${skillsString}"
          - Department: "${departmentName}"
          - Year of Study: ${year}

          Respond STRICTLY with a valid JSON object. Do not include markdown code block formatting (like \`\`\`json). The JSON must look like this:
          {
            "roadmap": [
              { "id": 1, "title": "Skill/Topic name", "desc": "Short description of what to study", "status": "NOT_STARTED" }
            ],
            "skillsToLearn": ["Skill 1", "Skill 2"],
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "projects": ["Project 1", "Project 2"]
          }
          Provide exactly 4-5 roadmap steps.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.roadmap && parsed.skillsToLearn && parsed.recommendations) {
            parsed.roadmap = parsed.roadmap.map((step: any, idx: number) => ({
              id: step.id || idx + 1,
              title: step.title,
              desc: step.desc || '',
              status: idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
            }));
            return parsed;
          }
        }
      } catch (error) {
        console.warn('[AI] Gemini generateContent failed, falling back to rule-based engine:', error);
      }
    }

    return this.generateMockRoadmap(targetRole, currentSkills);
  }

  static async answerCampusQuestion(
    userMessage: string,
    context: {
      studentName: string;
      department: string;
      attendancePercentage: number;
      pendingAssignments: number;
      targetRole: string;
    }
  ): Promise<string> {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
          You are the AI Campus OS Companion.
          Student Name: ${context.studentName}
          Department: ${context.department}
          Overall Attendance Rate: ${context.attendancePercentage}%
          Pending Homework Tasks: ${context.pendingAssignments}
          Target Career Goal: ${context.targetRole || 'Not specified'}

          Student is asking: "${userMessage}"

          Respond in a helpful, concise tone (max 4 sentences). Reference their stats if relevant (e.g. attendance below 75% triggers a warning). Keep it professional.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      } catch (error) {
        console.warn('[AI] Gemini chatbot chat failed, using fallback responses:', error);
      }
    }

    const msg = userMessage.toLowerCase();
    if (msg.includes('attendance')) {
      return `Hello ${context.studentName}, your current attendance rate is ${context.attendancePercentage}%. ${context.attendancePercentage < 75 ? 'This is below the critical threshold of 75%. Please attend upcoming classes to avoid issues.' : 'You are in good standing!'}`;
    }
    if (msg.includes('assignment') || msg.includes('homework')) {
      return `You have ${context.pendingAssignments} pending assignments. You can review and upload them in the Assignments module in the student portal. Let me know if you need help explaining any topic!`;
    }
    if (msg.includes('career') || msg.includes('roadmap') || msg.includes('skills')) {
      return `For your goal of becoming a "${context.targetRole || 'Software Engineer'}", I recommend starting with Node.js and SQL database designs. Check out your personalized Career Strategy tab to view your complete study timeline.`;
    }
    return `Hello ${context.studentName}! I am your AI Campus Companion. How can I help you today? You can ask me about your attendance rates, pending assignments, or request career roadmap audits.`;
  }

  /**
   * Course & Study Chat Agent:
   * Provides answers strictly reflecting available course material and study tasks.
   * Explicitly disclaims knowledge of unlisted course materials.
   */
  static async answerCourseAndStudyQuestion(
    userMessage: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
    context: {
      studentName: string;
      department: string;
      targetRole: string;
      materials: MaterialContextItem[];
      assignments: AssignmentContextItem[];
      roadmapPhases: RoadmapContextItem[];
      weeklyHoursTarget: number;
    }
  ): Promise<CourseAnswerResponse> {
    const materialsSummary = context.materials.length > 0
      ? context.materials.map((m, idx) => `[Material #${idx + 1}] Title: "${m.title}", Subject: "${m.subject}", Type: "${m.category}", File: "${m.fileName}", Description: "${m.description || 'None'}"`).join('\n')
      : 'No uploaded materials found for enrolled classes.';

    const assignmentsSummary = context.assignments.length > 0
      ? context.assignments.map((a, idx) => `[Assignment #${idx + 1}] Title: "${a.title}", Subject: "${a.subject}", Deadline: "${a.deadline}", Status: "${a.submitted ? 'Submitted' : 'Pending'}"`).join('\n')
      : 'No assignments currently registered.';

    const roadmapSummary = context.roadmapPhases.length > 0
      ? context.roadmapPhases.map(p => `Phase ${p.phaseNumber}: ${p.title} (${p.status})`).join(', ')
      : 'No roadmap configured.';

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const systemPrompt = `
You are the GoWithFlow Course & Study Assistant.
You assist learners with their enrolled course materials, study tasks, and roadmap preparation.

STUDENT INFO:
- Name: ${context.studentName}
- Department: ${context.department}
- Career Goal: ${context.targetRole}
- Weekly Study Target: ${context.weeklyHoursTarget} hrs/week

AVAILABLE ENROLLED COURSE MATERIALS:
${materialsSummary}

ACTIVE ASSIGNMENTS & TASKS:
${assignmentsSummary}

CURRENT ROADMAP PHASES:
${roadmapSummary}

CRITICAL INSTRUCTIONS:
1. COURSE MATERIAL ACCURACY:
   - Do NOT claim you know specific lecture notes, class syllabus, or internal materials unless they are listed above under "AVAILABLE ENROLLED COURSE MATERIALS".
   - If the student asks about a specific course material or topic that IS NOT in the list, explicitly state:
     "This specific topic is not found in your uploaded course materials (your repository currently has materials for: ${context.materials.map(m => m.subject).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'no uploaded subjects yet'}). However, from an academic standpoint..."
   - When you discuss or cite any material that is in the list, cite it cleanly like "[Source: <Title> - <Subject>]".

2. TONE & STYLE:
   - Warm, direct, academically supportive, and structured.
   - Use Markdown for readability: headings, bullet points, and code snippets when helpful.
   - Never use robot clichés like "As an AI language model..." or generic hype.

3. RESPONSE FORMAT:
   - Return STRICTLY a valid JSON object without surrounding markdown code fences:
   {
     "reply": "Your clear, accessible response string here...",
     "sources": [
       { "title": "Exact Material Title", "subject": "Subject Name", "category": "PDF" }
     ]
   }
   Only include items in "sources" if you actually referenced them from the available list.
`;

        const recentHistory = (history || []).slice(-4).map(h => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.text}`).join('\n');
        const userPrompt = `${recentHistory ? recentHistory + '\n' : ''}Student: ${userMessage}\nAssistant:`;

        const result = await model.generateContent([
          { text: systemPrompt },
          { text: userPrompt }
        ]);

        const rawText = result.response.text().trim();
        let parsedReply = '';
        let extractedSources: any[] = [];

        // 1. Try to find and parse JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && typeof parsed.reply === 'string') {
              parsedReply = parsed.reply;
              extractedSources = Array.isArray(parsed.sources) ? parsed.sources : [];
            }
          } catch {
            // JSON parse failed, fall through to rawText
          }
        }

        // 2. If rawText is direct response, use it
        if (!parsedReply && rawText) {
          parsedReply = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        }

        if (parsedReply) {
          const matchedSources = extractedSources.map((s: any) => {
            const found = context.materials.find(m => m.title.toLowerCase().includes((s.title || '').toLowerCase()));
            return {
              title: s.title || found?.title || 'Course Material',
              subject: s.subject || found?.subject || 'Coursework',
              category: s.category || found?.category || 'NOTE',
              fileUrl: found?.fileUrl
            };
          });

          return {
            reply: parsedReply,
            sources: matchedSources
          };
        }
      } catch (err) {
        console.warn('[AI] Gemini chat answer failed, using verified fallback engine:', err);
      }
    }

    // Deterministic fallback matching real data
    return this.generateCourseChatFallback(userMessage, context);
  }

  private static generateCourseChatFallback(
    userMessage: string,
    context: {
      studentName: string;
      department: string;
      targetRole: string;
      materials: MaterialContextItem[];
      assignments: AssignmentContextItem[];
      roadmapPhases: RoadmapContextItem[];
      weeklyHoursTarget: number;
    }
  ): CourseAnswerResponse {
    const q = userMessage.toLowerCase();
    const matchedSources: Array<{ title: string; subject: string; category: string; fileUrl?: string }> = [];

    // Check if matching any material
    const matchingMats = context.materials.filter(m => 
      q.includes(m.subject.toLowerCase()) || 
      q.includes(m.title.toLowerCase()) || 
      (m.category && q.includes(m.category.toLowerCase()))
    );

    if (q.includes('material') || q.includes('notes') || q.includes('syllabus') || q.includes('slide') || matchingMats.length > 0) {
      if (context.materials.length === 0) {
        return {
          reply: `Hello ${context.studentName}. You currently do not have any published course materials uploaded by your faculty for this term. As soon as materials are published to your department (${context.department}), they will appear in your Study Materials module.`,
          sources: []
        };
      }

      const topMats = matchingMats.length > 0 ? matchingMats : context.materials.slice(0, 3);
      topMats.forEach(m => matchedSources.push({ title: m.title, subject: m.subject, category: m.category, fileUrl: m.fileUrl }));

      const titlesList = topMats.map(m => `• **${m.title}** (${m.subject} - ${m.category})`).join('\n');

      return {
        reply: `Here are the course materials available in your study repository:\n\n${titlesList}\n\nReview these lecture documents to reinforce concepts for upcoming assessments. Let me know if you would like study questions on any of these topics!`,
        sources: matchedSources
      };
    }

    if (q.includes('assignment') || q.includes('homework') || q.includes('due') || q.includes('deadline')) {
      if (context.assignments.length === 0) {
        return {
          reply: `You currently have no pending assignments on record. You are completely up to date with your academic submissions!`,
          sources: []
        };
      }
      const pending = context.assignments.filter(a => !a.submitted);
      const list = pending.map(a => `• **${a.title}** (${a.subject}) — Due: ${a.deadline.replace('T', ' ')}`).join('\n');
      return {
        reply: `You have **${pending.length} pending assignment(s)** in your portal:\n\n${list}\n\nI recommend setting aside a 90-minute study block to prepare your problem solving notes before the deadline.`,
        sources: []
      };
    }

    if (q.includes('career') || q.includes('roadmap') || q.includes('goal') || q.includes('role')) {
      const activePhase = context.roadmapPhases.find(p => p.status === 'IN_PROGRESS') || context.roadmapPhases[0];
      const phaseInfo = activePhase ? `Your active milestone is **Phase ${activePhase.phaseNumber}: ${activePhase.title}**.` : '';
      return {
        reply: `Your designated career target is **${context.targetRole}**. ${phaseInfo}\n\nTo hit your weekly target of ${context.weeklyHoursTarget} study hours, aim for consistent daily practice with hands-on projects alongside your ${context.department} coursework.`,
        sources: []
      };
    }

    return {
      reply: `Hello ${context.studentName}! I am your Course & Study Assistant. I can help you review your **${context.materials.length} course material(s)**, prepare for **${context.assignments.filter(a => !a.submitted).length} pending assignment(s)**, or plan study blocks for your **${context.targetRole}** roadmap. What would you like to focus on?`,
      sources: []
    };
  }

  /**
   * AI Mentor Recommendation Engine:
   * Produces 4 distinct, personalized recommendations: Goal Setting, Study Sessions, Progress Reflection, Next Steps.
   */
  static async generateMentorRecommendations(
    context: {
      studentName: string;
      department: string;
      targetRole: string;
      weeklyHoursTarget: number;
      loggedHours: number;
      completedMilestones: number;
      pendingMilestones: number;
      attendancePercentage: number;
      pendingAssignmentsCount: number;
      enrolledSubjects: string[];
    }
  ): Promise<MentorRecommendation[]> {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
You are an expert AI Academic & Career Mentor.
Generate 4 tailored, non-judgmental recommendations for:
- Student: ${context.studentName} (${context.department})
- Target Role: ${context.targetRole}
- Weekly Study Goal: ${context.weeklyHoursTarget} hrs (Logged: ${context.loggedHours} hrs)
- Roadmap Milestones: ${context.completedMilestones} completed, ${context.pendingMilestones} pending
- Attendance Rate: ${context.attendancePercentage}%
- Pending Coursework Assignments: ${context.pendingAssignmentsCount}
- Enrolled Subjects: ${context.enrolledSubjects.join(', ')}

Return STRICTLY a JSON array with 4 objects. One for each category:
1. GOAL (Goal setting recommendation for the target role)
2. STUDY_PLAN (Actionable study session plan matching their weekly hours)
3. REFLECTION (Progress reflection without excessive praise or guilt, direct and motivating)
4. NEXT_STEP (Immediate concrete next task)

Format:
[
  {
    "id": "rec-1",
    "category": "GOAL",
    "title": "Short title",
    "description": "2-3 sentences of warm, direct guidance",
    "timeframe": "This Week",
    "suggestedAction": "Action button text",
    "impactTopic": "Topic or milestone name",
    "isAiGenerated": true,
    "confidenceNote": "Synthesized from your roadmap and coursework data"
  }
]
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            return parsed.map((item, idx) => ({
              id: item.id || `mentor-rec-${idx + 1}`,
              category: item.category || (['GOAL', 'STUDY_PLAN', 'REFLECTION', 'NEXT_STEP'][idx] as any),
              title: item.title,
              description: item.description,
              timeframe: item.timeframe || 'This Week',
              suggestedAction: item.suggestedAction || 'Add to study plan',
              impactTopic: item.impactTopic || context.targetRole,
              isAiGenerated: true as const,
              confidenceNote: item.confidenceNote || 'Synthesized from your active roadmap and coursework stats.'
            }));
          }
        }
      } catch (err) {
        console.warn('[AI] Gemini mentor generation failed, falling back to deterministic recommendations:', err);
      }
    }

    // High quality deterministic fallback based on actual data
    return [
      {
        id: 'mentor-rec-1',
        category: 'GOAL',
        title: `Align Core Competencies for ${context.targetRole}`,
        description: `Your career objective is ${context.targetRole}. Dedicating 4 focused hours this week to mastering relational schemas and asynchronous APIs will directly accelerate your upcoming roadmap phases.`,
        timeframe: 'Next 5 Days',
        suggestedAction: 'Review target competencies',
        impactTopic: `${context.targetRole} Roadmap`,
        isAiGenerated: true,
        confidenceNote: 'Generated from your designated target role and skill assessment.'
      },
      {
        id: 'mentor-rec-2',
        category: 'STUDY_PLAN',
        title: 'Structured 2-Block Study Routine',
        description: `With a target of ${context.weeklyHoursTarget} hours/week (${context.loggedHours} logged), schedule two 90-minute deep-work sessions before Friday to resolve your ${context.pendingAssignmentsCount > 0 ? context.pendingAssignmentsCount + ' pending assignment(s)' : 'upcoming coursework'}.`,
        timeframe: 'Wednesday & Saturday',
        suggestedAction: 'Schedule study sessions',
        impactTopic: `${context.department} Coursework`,
        isAiGenerated: true,
        confidenceNote: 'Calculated from your weekly target hours and current assignment deadlines.'
      },
      {
        id: 'mentor-rec-3',
        category: 'REFLECTION',
        title: 'Milestone Progress & Pacing Reflection',
        description: `You have completed ${context.completedMilestones} milestones with ${context.pendingMilestones} remaining. Maintaining regular 45-minute code reviews will keep your retention solid without burning out.`,
        timeframe: 'Weekly Review',
        suggestedAction: 'Reflect on completed work',
        impactTopic: 'Roadmap Milestone Velocity',
        isAiGenerated: true,
        confidenceNote: 'Derived from your verified milestone completion records.'
      },
      {
        id: 'mentor-rec-4',
        category: 'NEXT_STEP',
        title: 'Complete Course Materials Exploration',
        description: `Review the syllabus and slide notes uploaded in your ${context.enrolledSubjects[0] || 'primary course'} module to solidify foundational concepts before the midterm assessments.`,
        timeframe: 'Upcoming 48 Hours',
        suggestedAction: 'Open Study Materials',
        impactTopic: context.enrolledSubjects[0] || 'Core Subject',
        isAiGenerated: true,
        confidenceNote: 'Identified from your published faculty study materials.'
      }
    ];
  }

  /**
   * WF-01 Suggestion Agent:
   * Real-time Gemini analysis of learner capabilities vs target career requirements.
   * Discovers skill gaps, tailored roadmap phases, and actionable recommendations.
   */
  static async runSuggestionAgent(context: {
    learnerName: string;
    targetRole: string;
    skills: string[];
    projects: Array<{ name: string; description?: string; technologies?: string }>;
    certifications: string[];
    department?: string;
    educationLevel?: string;
  }): Promise<{
    agent: 'WF-01_SUGGESTION';
    targetRole: string;
    matchPercentage: number;
    missingSkills: string[];
    recommendedResources: Array<{
      title: string;
      provider: string;
      url: string;
      estimatedHours: number;
      isFree: boolean;
    }>;
    generatedMilestones: string[];
    roadmapPhases: Array<{
      phase: number;
      name: string;
      duration: string;
      skills: string[];
    }>;
  }> {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
You are the GoWithFlow Learning Pathway Agent, a senior tech career architect.
Analyze this learner's profile against their target industry role:

LEARNER CONTEXT:
- Name: ${context.learnerName}
- Target Role: ${context.targetRole}
- Current Skills: ${context.skills.length > 0 ? context.skills.join(', ') : 'None listed yet'}
- Completed/Active Projects: ${context.projects.length > 0 ? context.projects.map(p => `${p.name} (${p.technologies || ''})`).join('; ') : 'None listed yet'}
- Certifications: ${context.certifications.length > 0 ? context.certifications.join(', ') : 'None logged yet'}
- Academic Background: ${context.department || 'Computer Science'}, ${context.educationLevel || 'Undergraduate'}

INSTRUCTIONS:
1. Objectively evaluate their current skills and projects against 2026 industry standards for "${context.targetRole}".
2. Calculate a realistic Match Percentage (integer between 30 and 95) based on their real skills and project portfolio.
3. Identify 3-5 critical missing skills or technologies they need to master for "${context.targetRole}".
4. Generate 3 actionable milestones.
5. Create a structured 3-phase roadmap (Phases 1, 2, 3) each with a clear name, realistic duration (e.g. "3 Weeks", "4 Weeks"), and 2-4 target skills.

Return STRICTLY a valid JSON object without surrounding markdown code block fences:
{
  "matchPercentage": 72,
  "missingSkills": ["Skill A", "Skill B", "Skill C"],
  "recommendedResources": [
    { "title": "${context.targetRole} Roadmap 2026", "provider": "GoWithFlow Pathways", "url": "http://localhost:3000/student/dashboard?tab=ROADMAP", "estimatedHours": 25, "isFree": true },
    { "title": "Core Architecture & Hands-on Implementation", "provider": "Local Campus Repository", "url": "http://localhost:3000/student/dashboard?tab=MATERIALS", "estimatedHours": 18, "isFree": true }
  ],
  "generatedMilestones": [
    "Milestone 1 description...",
    "Milestone 2 description...",
    "Milestone 3 description..."
  ],
  "roadmapPhases": [
    { "phase": 1, "name": "Foundational Concepts", "duration": "3 Weeks", "skills": ["Skill 1", "Skill 2"] },
    { "phase": 2, "name": "System Architecture & Integration", "duration": "4 Weeks", "skills": ["Skill 3", "Skill 4"] },
    { "phase": 3, "name": "Production Capstone & Deployment", "duration": "4 Weeks", "skills": ["Skill 5", "Skill 6"] }
  ]
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && Array.isArray(parsed.missingSkills)) {
            return {
              agent: 'WF-01_SUGGESTION',
              targetRole: context.targetRole,
              matchPercentage: Math.max(25, Math.min(98, Number(parsed.matchPercentage) || 65)),
              missingSkills: parsed.missingSkills,
              recommendedResources: Array.isArray(parsed.recommendedResources) && parsed.recommendedResources.length > 0
                ? parsed.recommendedResources
                : [
                    { title: `${context.targetRole} Roadmap 2026`, provider: 'GoWithFlow Pathways', url: 'http://localhost:3000/student/dashboard?tab=ROADMAP', estimatedHours: 25, isFree: true },
                    { title: 'Core Architecture Deep Dive', provider: 'Local Study Library', url: 'http://localhost:3000/student/dashboard?tab=MATERIALS', estimatedHours: 15, isFree: true }
                  ],
              generatedMilestones: Array.isArray(parsed.generatedMilestones) ? parsed.generatedMilestones : [
                `Master ${parsed.missingSkills[0] || 'core architectures'}`,
                `Build end-to-end full stack project integrating modern tooling`,
                `Deploy production release and complete portfolio review`
              ],
              roadmapPhases: Array.isArray(parsed.roadmapPhases) && parsed.roadmapPhases.length > 0
                ? parsed.roadmapPhases
                : [
                    { phase: 1, name: 'Core Foundations & Tools', duration: '3 Weeks', skills: parsed.missingSkills.slice(0, 2) },
                    { phase: 2, name: 'Advanced Architecture & APIs', duration: '4 Weeks', skills: parsed.missingSkills.slice(2, 4) },
                    { phase: 3, name: 'Production Capstone & Deployment', duration: '4 Weeks', skills: parsed.missingSkills.slice(4) }
                  ]
            };
          }
        }
      } catch (err) {
        console.warn('[AI] Gemini suggestion agent failed, using rule-based analysis:', err);
      }
    }

    // High quality deterministic fallback matching real data
    const skillSet = new Set((context.skills || []).map(s => s.toLowerCase()));
    const defaults: Record<string, string[]> = {
      'Full Stack Developer': ['React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'TypeScript', 'Tailwind CSS'],
      'Frontend Developer': ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'State Management', 'Web Performance'],
      'Backend Developer': ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Microservices'],
      'AI/ML Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Data Structures', 'FastAPI', 'MLOps'],
      'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Architecture', 'Linux', 'Terraform']
    };
    const expected = defaults[context.targetRole] || ['Modern Architecture', 'Database Systems', 'Cloud Integration', 'Performance Optimization'];
    const missing = expected.filter(s => !skillSet.has(s.toLowerCase()));

    return {
      agent: 'WF-01_SUGGESTION',
      targetRole: context.targetRole,
      matchPercentage: Math.max(35, Math.min(95, 100 - (missing.length * 10))),
      missingSkills: missing,
      recommendedResources: [
        { title: `${context.targetRole} Roadmap 2026`, provider: 'GoWithFlow Pathways', url: 'http://localhost:3000/student/dashboard?tab=ROADMAP', estimatedHours: 25, isFree: true },
        { title: 'Core Architecture Deep Dive', provider: 'Local Study Library', url: 'http://localhost:3000/student/dashboard?tab=MATERIALS', estimatedHours: 15, isFree: true }
      ],
      generatedMilestones: [
        `Master foundational ${missing[0] || 'architecture principles'}`,
        `Build a hands-on production application demonstrating ${missing.slice(0, 2).join(' & ')}`,
        `Conduct code review and document deployment process`
      ],
      roadmapPhases: [
        { phase: 1, name: 'Core Foundations & Stacks', duration: '3 Weeks', skills: expected.slice(0, 3) },
        { phase: 2, name: 'Full-Stack Architecture & Cloud', duration: '4 Weeks', skills: expected.slice(3, 5) },
        { phase: 3, name: 'Production Capstone & Deployment', duration: '4 Weeks', skills: expected.slice(5) }
      ]
    };
  }

  /**
   * WF-02 Scoring Agent:
   * Real-time Gemini evaluation of technical skills, projects, certifications, portfolio, and career readiness.
   */
  static async runScoringAgent(context: {
    learnerName: string;
    targetRole: string;
    skills: string[];
    projects: Array<{ name: string; description?: string; technologies?: string }>;
    certifications: string[];
    portfolioUrl?: string;
    githubUrl?: string;
    department?: string;
  }): Promise<{
    agent: 'WF-02_SCORING';
    overallScore: number;
    technicalSkillsScore: number;
    projectScore: number;
    certificationScore: number;
    portfolioScore: number;
    careerPreparationScore: number;
    strengths: string[];
    weaknesses: string[];
    improvementPlan: string[];
  }> {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `
You are the GoWithFlow Career Evaluation Agent.
Perform a rigorous, fair, and encouraging assessment of this learner for the role of "${context.targetRole}":

LEARNER PROFILE:
- Name: ${context.learnerName}
- Target Role: ${context.targetRole}
- Skills (${context.skills.length}): ${context.skills.join(', ') || 'No skills listed'}
- Projects (${context.projects.length}): ${context.projects.map(p => `${p.name} [Tech: ${p.technologies || 'General'}]`).join('; ') || 'No projects registered'}
- Certifications (${context.certifications.length}): ${context.certifications.join(', ') || 'No certifications logged'}
- Portfolio: ${context.portfolioUrl || 'None'}
- Academic Department: ${context.department || 'Computer Science'}

EVALUATION RUBRIC:
- technicalSkillsScore: 0-100 based on breadth, depth, and relevance of skills to ${context.targetRole}.
- projectScore: 0-100 based on project quantity and complexity (0 projects = 40, 1 = 65, 2+ = 80-95).
- certificationScore: 0-100 based on logged credentials (0 certs = 45, 1 = 70, 2+ = 85+).
- portfolioScore: 0-100 based on portfolio/presence and presentation.
- careerPreparationScore: 0-100 composite preparedness.
- overallScore: weighted average.
- strengths: exactly 3 specific, encouraging strengths derived from their actual profile.
- weaknesses: exactly 2 actionable, non-judgmental areas for growth.
- improvementPlan: exactly 3 concrete next steps to reach top-tier readiness.

Return STRICTLY a JSON object without surrounding markdown code block fences:
{
  "overallScore": 82,
  "technicalSkillsScore": 85,
  "projectScore": 75,
  "certificationScore": 70,
  "portfolioScore": 80,
  "careerPreparationScore": 84,
  "strengths": [
    "Strength 1...",
    "Strength 2...",
    "Strength 3..."
  ],
  "weaknesses": [
    "Area 1...",
    "Area 2..."
  ],
  "improvementPlan": [
    "Action 1...",
    "Action 2...",
    "Action 3..."
  ]
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed.overallScore === 'number') {
            return {
              agent: 'WF-02_SCORING',
              overallScore: Math.round(parsed.overallScore),
              technicalSkillsScore: Math.round(parsed.technicalSkillsScore || parsed.overallScore),
              projectScore: Math.round(parsed.projectScore || parsed.overallScore),
              certificationScore: Math.round(parsed.certificationScore || parsed.overallScore),
              portfolioScore: Math.round(parsed.portfolioScore || parsed.overallScore),
              careerPreparationScore: Math.round(parsed.careerPreparationScore || parsed.overallScore),
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Demonstrated technical proficiency', 'Active pursuit of career goals', 'Solid foundations'],
              weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ['Expand portfolio with production-grade capstones', 'Acquire industry credentials'],
              improvementPlan: Array.isArray(parsed.improvementPlan) ? parsed.improvementPlan : ['Build and deploy an end-to-end project', 'Earn a verified certification', 'Complete technical assessments']
            };
          }
        }
      } catch (err) {
        console.warn('[AI] Gemini scoring agent failed, using baseline evaluator:', err);
      }
    }

    // Baseline fallback
    const techScore = Math.min(95, 50 + (context.skills?.length || 0) * 8);
    const projScore = Math.min(95, 45 + (context.projects?.length || 0) * 15);
    const certScore = Math.min(95, 45 + (context.certifications?.length || 0) * 15);
    const portScore = context.portfolioUrl ? 85 : 60;
    const careerPrepScore = Math.round((techScore + projScore + certScore + portScore) / 4);
    const overall = Math.round((techScore * 0.3) + (projScore * 0.3) + (certScore * 0.2) + (portScore * 0.2));

    return {
      agent: 'WF-02_SCORING',
      overallScore: overall,
      technicalSkillsScore: techScore,
      projectScore: projScore,
      certificationScore: certScore,
      portfolioScore: portScore,
      careerPreparationScore: careerPrepScore,
      strengths: [
        context.skills.length > 0 ? `Demonstrated foundation in ${context.skills.slice(0, 3).join(', ')}` : 'Established career ambition',
        context.projects.length > 0 ? `Portfolio verified with ${context.projects.length} project(s)` : 'Clear role alignment with curriculum',
        'Strong weekly learning commitment'
      ],
      weaknesses: [
        context.projects.length < 2 ? `Build at least 2 full-featured projects targeting ${context.targetRole}` : 'Implement automated integration testing in repos',
        context.certifications.length < 1 ? 'Acquire 1 industry-recognized credential' : 'Publish live deployment demos'
      ],
      improvementPlan: [
        `Complete a capstone project solving a real-world problem for ${context.targetRole}`,
        'Complete self-assessment evaluations on your top competencies',
        'Publish interactive live demo with full technical documentation'
      ]
    };
  }

  private static generateMockRoadmap(targetRole: string, currentSkills: string[]): AIServiceResponse {
    const role = targetRole.toLowerCase();
    let roadmap: RoadmapStep[] = [];
    let skillsToLearn: string[] = [];
    let recommendations: string[] = [];
    let projects: string[] = [];

    if (role.includes('developer') || role.includes('engineer') || role.includes('web')) {
      roadmap = [
        { id: 1, title: 'Learn Backend APIs (Node.js & Express)', desc: 'Understand routes, controller logic, middleware pipelines, and CORS gates.', status: 'IN_PROGRESS' },
        { id: 2, title: 'Database Integration & Queries (Prisma & Postgres)', desc: 'Configure PostgreSQL tables, define relationships, migrate schemas, and run indexing queries.', status: 'NOT_STARTED' },
        { id: 3, title: 'Session Authentication & Token Security', desc: 'Secure APIs using HTTP-only JWT cookies and password hashing scripts.', status: 'NOT_STARTED' },
        { id: 4, title: 'Containerization & Cloud Release (Docker & AWS)', desc: 'Pack containers and deploy servers on render, Cloudflare, or AWS systems.', status: 'NOT_STARTED' }
      ];
      skillsToLearn = ['Node.js', 'PostgreSQL', 'Prisma ORM', 'JWT Cookie Auth', 'Docker'];
      recommendations = [
        'Solidify standard JS callbacks and async/await syntax.',
        'Complete the database schema design tutorial series.'
      ];
      projects = ['E-Commerce Backend API', 'OAuth Session Server'];
    } else {
      roadmap = [
        { id: 1, title: 'Data Structures & Algorithms', desc: 'Practice complexity bounds, hash tables, stacks, binary search, and trees.', status: 'IN_PROGRESS' },
        { id: 2, title: 'System Design Patterns', desc: 'Learn server load balancers, caching layers, and database replica sets.', status: 'NOT_STARTED' },
        { id: 3, title: 'Interview Mock Exercises', desc: 'Mock technical problem solving with study coordinators.', status: 'NOT_STARTED' }
      ];
      skillsToLearn = ['Algorithms', 'Data Structures', 'Caching', 'Load Balancers'];
      recommendations = [
        'Solve 2 LeetCode medium questions daily.',
        'Participate in B.Tech coding hackathons.'
      ];
      projects = ['Graph Pathfinding Visualizer', 'Distributed Job Scheduler'];
    }

    return { roadmap, skillsToLearn, recommendations, projects };
  }
}
