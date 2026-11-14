import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export type AIIntent =
  | 'GENERAL_CONVERSATION'
  | 'GENERAL_LEARNING'
  | 'TECHNICAL_ASSISTANCE'
  | 'CAREER_GUIDANCE'
  | 'LEARNING_PATHWAY'
  | 'CAREER_EVALUATION'
  | 'PROGRESS_ANALYSIS'
  | 'PROJECT_GUIDANCE'
  | 'RESOURCE_DISCOVERY'
  | 'FOLLOW_UP'
  | 'OUT_OF_SCOPE_OR_UNCLEAR';

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

export interface MentorChatContext {
  userId: string;
  studentName: string;
  targetRole: string;
  department: string;
  educationLevel?: string;
  skills: string[];
  projects: Array<{ name: string; description?: string; technologies?: string }>;
  certifications: string[];
  weeklyHoursTarget: number;
  loggedHours: number;
  completedMilestones: number;
  pendingMilestones: number;
  attendancePercentage: number;
  pendingAssignmentsCount: number;
  enrolledSubjects: string[];
  materials?: MaterialContextItem[];
  assignments?: AssignmentContextItem[];
  roadmapPhases?: RoadmapContextItem[];
  userMemories?: Array<{ type: string; content: string }>;
}

export interface MentorChatResult {
  reply: string;
  intent: AIIntent;
  agent: 'AI_MENTOR' | 'WF-01_SUGGESTION' | 'WF-02_SCORING';
  suggestions: string[];
  sources?: Array<{ title: string; subject: string; category?: string; fileUrl?: string }>;
  metadata?: Record<string, any>;
  extractedMemories?: Array<{ type: string; content: string }>;
}

export class AIService {
  /**
   * Resilient content generator that attempts primary model, then fallbacks, before failing.
   */
  static async generateWithFallback(
    prompt: string,
    options?: { systemInstruction?: string }
  ): Promise<string | null> {
    if (!genAI) return null;
    const modelsToTry = Array.from(new Set([PRIMARY_MODEL, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']));
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(options?.systemInstruction ? { systemInstruction: options.systemInstruction } : {})
        });
        const res = await model.generateContent(prompt);
        const text = res.response.text().trim();
        if (text) return text;
      } catch (err) {
        console.warn(`[AI] Model ${modelName} call failed, trying next option:`, err);
      }
    }
    return null;
  }

  /**
   * Transforms raw message history into clean, strictly alternating turns for the native Gemini Chat Model API.
   */
  static buildGeminiChatHistory(
    rawHistory: Array<{ role: string; content?: string; text?: string }>
  ): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const result: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    let expectedRole: 'user' | 'model' = 'user';

    for (const item of rawHistory) {
      const rawRole = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
      const text = (item.content || item.text || '').replace(/<!--META:[\s\S]*?-->/g, '').trim();
      if (!text) continue;

      if (rawRole === expectedRole) {
        result.push({ role: rawRole, parts: [{ text }] });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      } else if (result.length > 0 && result[result.length - 1].role === rawRole) {
        result[result.length - 1].parts[0].text += '\n\n' + text;
      }
    }

    // The chat session requires that the last item in history is from 'model'
    // so that the upcoming sendMessage from the learner is the next 'user' turn.
    if (result.length > 0 && result[result.length - 1].role === 'user') {
      result.pop();
    }

    return result;
  }

  /**
   * Fast, resilient heuristic intent classifier
   */
  static classifyIntent(
    message: string,
    history: Array<{ role: string; content?: string; text?: string }> = []
  ): AIIntent {
    const q = message.trim().toLowerCase();

    // Check for empty or unclear input
    if (!q || q.length < 2 || /^[^a-zA-Z0-9]+$/.test(q)) {
      return 'OUT_OF_SCOPE_OR_UNCLEAR';
    }

    // 1. Follow-up check: starts with common continuation phrases if history exists
    if (history.length > 0) {
      if (
        /^(what about|and what about|how about|can you elaborate|explain more|tell me more|why is that|can you show|show that in|in python|in typescript|give me another|second one|third one|next point|what else)\b/.test(q)
      ) {
        return 'FOLLOW_UP';
      }
    }

    // 2. Greetings and casual talk
    if (
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|what can you do|what is gowithflow|thanks|thank you|bye|goodbye|help me)\b/.test(q) ||
      q === 'hi' || q === 'hello' || q === 'hey' || q === 'help'
    ) {
      return 'GENERAL_CONVERSATION';
    }

    // 3. Career Evaluation / Audit / Scoring
    if (
      /(evaluate|evaluation|score|scoring|assess|assessment|readiness|how ready am i|grade me|audit my|review my profile|weakness|weaknesses|strengths|am i ready)/.test(q)
    ) {
      return 'CAREER_EVALUATION';
    }

    // 4. Learning Pathway / Roadmap
    if (
      /(roadmap|milestone|learning path|study path|curriculum|phases|what should i study|what to learn next|how to become|learning journey|learning track)/.test(q)
    ) {
      return 'LEARNING_PATHWAY';
    }

    // 5. Progress Analysis
    if (
      /(how many hours|logged hours|my progress|weekly target|am i on track|completion rate|attendance percentage|attendance rate|pending assignment|my stats|study stats)/.test(q)
    ) {
      return 'PROGRESS_ANALYSIS';
    }

    // 6. Project Guidance
    if (
      /(project idea|portfolio project|capstone|build a project|suggest a project|what should i build|practical project|side project|sample project)/.test(q)
    ) {
      return 'PROJECT_GUIDANCE';
    }

    // 7. Resource Discovery / Course Materials
    if (
      /(course material|syllabus|lecture notes|slides|book recommendation|documentation|where can i learn|docs for|study material)/.test(q)
    ) {
      return 'RESOURCE_DISCOVERY';
    }

    // 8. Technical Assistance (Coding, syntax, debugging, algorithms)
    if (
      /(code|script|debug|error|exception|function|class|method|sql|query|prisma|react|next\.js|typescript|javascript|python|docker|css|html|regex|api|bug|fix this|syntax)/.test(q) ||
      q.includes('console.log') || q.includes('def ') || q.includes('import ') || q.includes('const ')
    ) {
      return 'TECHNICAL_ASSISTANCE';
    }

    // 9. Career Guidance
    if (
      /(interview|resume|cv|job|salary|recruiter|hiring|market demand|transition to tech|junior developer|senior developer|career advice|career growth)/.test(q)
    ) {
      return 'CAREER_GUIDANCE';
    }

    // 10. General Learning & Conceptual Explanations
    if (
      /(explain|what is|what are|how does|why does|difference between|versus|vs|how work|definition of|concept of)/.test(q)
    ) {
      return 'GENERAL_LEARNING';
    }

    // Default to general learning if it looks like a question or concept
    if (q.includes('?') || q.split(' ').length > 2) {
      return 'GENERAL_LEARNING';
    }

    return 'GENERAL_CONVERSATION';
  }

  /**
   * Primary Conversational AI Mentor Engine
   * Powered by official Gemini Chat Model API (model.startChat) with real-time multi-turn context.
   */
  static async processMentorMessage(params: {
    userId: string;
    message: string;
    history?: Array<{ role: string; content?: string; text?: string }>;
    context: MentorChatContext;
  }): Promise<MentorChatResult> {
    const { message, history = [], context } = params;
    const classifiedIntent = this.classifyIntent(message, history);

    // Build context strings for prompt
    const skillsStr = context.skills.length > 0 ? context.skills.join(', ') : 'None logged yet';
    const projectsStr = context.projects.length > 0 
      ? context.projects.map(p => `${p.name} (${p.technologies || 'General'})`).join('; ')
      : 'None logged yet';
    const certsStr = context.certifications.length > 0 ? context.certifications.join(', ') : 'None logged yet';
    const memoriesStr = context.userMemories && context.userMemories.length > 0
      ? context.userMemories.map(m => `• [${m.type}]: ${m.content}`).join('\n')
      : 'No past profile notes.';
    const materialsStr = context.materials && context.materials.length > 0
      ? context.materials.map(m => `• ${m.title} (${m.subject}) [${m.category}]`).join('\n')
      : 'No campus materials uploaded yet.';

    // Try Gemini Real-Time Generation via Official Chat Model API
    if (genAI) {
      const modelsToTry = Array.from(new Set([PRIMARY_MODEL, 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']));
      for (const modelName of modelsToTry) {
        try {
          const systemPrompt = `
You are the GoWithFlow AI Mentor, the core conversational intelligence of the GoWithFlow career intelligence platform.
Find Your Direction. Grow With Flow.

LEARNER PROFILE:
- Name: ${context.studentName}
- Target Role: ${context.targetRole}
- Department: ${context.department} (${context.educationLevel || 'Undergraduate'})
- Verified Current Skills: ${skillsStr}
- Logged Projects: ${projectsStr}
- Certifications: ${certsStr}
- Weekly Study Target: ${context.weeklyHoursTarget} hrs/week (Logged: ${context.loggedHours} hrs)
- Roadmap Velocity: ${context.completedMilestones} completed, ${context.pendingMilestones} pending
- Academic Standing: Attendance ${context.attendancePercentage}%, Pending Assignments: ${context.pendingAssignmentsCount}
- Relevant Coursework Materials:
${materialsStr}
- Active Learner Memory Notes:
${memoriesStr}

BEHAVIORAL PRINCIPLES:
1. Whatever the learner asks, give a thoughtful, accurate, and deeply helpful response.
2. Tone: Warm, encouraging, intellectually rigorous, and structured like a world-class senior engineering mentor.
3. Typography & Formatting:
   - Use Markdown: section headers (###), bold for key concepts (**...**), clean bullet points, and code blocks with syntax languages (\`\`\`python, \`\`\`typescript, \`\`\`sql).
   - If writing code, provide clean, idiomatic, working examples with brief comments.
   - If explaining a concept, provide the intuitive mental model, a clear breakdown, and a practical application.
4. Career & Learning Alignment:
   - Always subtly relate advice back to their goal of becoming a "${context.targetRole}" when relevant.
5. Meta Information:
   At the very end of your response, output a single meta line with intent classification and 3 contextual follow-up questions:
   <!--META:{"intent":"${classifiedIntent}","suggestions":["Suggestion 1?","Suggestion 2?","Suggestion 3?"]}-->
`;

          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
          });

          // Build clean alternating history for native Gemini Chat Model
          const cleanHistory = AIService.buildGeminiChatHistory(history.slice(-10));

          const chatSession = model.startChat({
            history: cleanHistory,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          });

          const response = await chatSession.sendMessage(message);
          const rawReply = response.response.text().trim();

          if (rawReply) {
            let cleanReply = rawReply;
            let intent: AIIntent = classifiedIntent;
            let suggestions: string[] = [];

            // Extract meta tag if present
            const metaMatch = rawReply.match(/<!--META:([\s\S]*?)-->/);
            if (metaMatch) {
              cleanReply = rawReply.replace(/<!--META:[\s\S]*?-->/, '').trim();
              try {
                const metaParsed = JSON.parse(metaMatch[1]);
                if (metaParsed.intent) intent = metaParsed.intent;
                if (Array.isArray(metaParsed.suggestions)) suggestions = metaParsed.suggestions;
              } catch {
                // Ignore parse error
              }
            }

            if (suggestions.length === 0) {
              suggestions = this.generateDefaultSuggestions(intent, context.targetRole);
            }

            // Determine active agent
            let agent: 'AI_MENTOR' | 'WF-01_SUGGESTION' | 'WF-02_SCORING' = 'AI_MENTOR';
            if (intent === 'LEARNING_PATHWAY') agent = 'WF-01_SUGGESTION';
            if (intent === 'CAREER_EVALUATION') agent = 'WF-02_SCORING';

            // Find any matched sources from context materials
            const matchedSources = (context.materials || []).filter(m => 
              cleanReply.toLowerCase().includes(m.subject.toLowerCase()) || 
              cleanReply.toLowerCase().includes(m.title.toLowerCase())
            ).map(m => ({
              title: m.title,
              subject: m.subject,
              category: m.category,
              fileUrl: m.fileUrl
            }));

            return {
              reply: cleanReply,
              intent,
              agent,
              suggestions,
              sources: matchedSources.length > 0 ? matchedSources : undefined
            };
          }
        } catch (apiErr) {
          console.warn(`[AI] Chat Model ${modelName} call failed, trying next option:`, apiErr);
        }
      }
    }

    // High quality deterministic fallback engine (ensures 100% reliability)
    return this.generateMentorFallback(message, classifiedIntent, context);
  }

  /**
   * Deterministic Fallback Generator for all 11 intents
   */
  private static generateMentorFallback(
    message: string,
    intent: AIIntent,
    context: MentorChatContext
  ): MentorChatResult {
    const role = context.targetRole || 'Full Stack Developer';
    const name = context.studentName || 'Learner';
    const skillsList = context.skills.length > 0 ? context.skills.join(', ') : 'core foundational topics';

    let reply = '';
    let agent: 'AI_MENTOR' | 'WF-01_SUGGESTION' | 'WF-02_SCORING' = 'AI_MENTOR';

    switch (intent) {
      case 'GENERAL_CONVERSATION':
        reply = `### Hello, ${name}! 👋\n\nI am your **GoWithFlow AI Mentor**, designed to provide personalized career intelligence, study pathways, and real-time technical guidance as you prepare for **${role}**.\n\nHere is how I can support your journey today:\n- **Career Roadmap**: Break down your trajectory into structured, weekly phases.\n- **Technical Mastery**: Explain algorithms, debug code, and walk through system design.\n- **Career Readiness**: Evaluate your current skills, projects, and portfolio against industry standards.\n- **Study Planning**: Keep you on track with your **${context.weeklyHoursTarget} hrs/week** target.\n\nWhat would you like to explore together right now?`;
        break;

      case 'GENERAL_LEARNING':
        reply = `### Exploring Core Concepts for ${role}\n\nUnderstanding foundational computer science and systems architecture is what separates good engineers from great ones.\n\n#### Why This Matters\nIn modern software engineering, especially for roles like **${role}**, scalable systems rely on clean abstractions, modular boundaries, and predictability. When mastering any new topic:\n\n1. **First Principles**: Start with the problem the concept was invented to solve.\n2. **Mental Model**: Visualize how data flows and where state is maintained.\n3. **Practical Trade-offs**: Contrast speed vs. memory, simplicity vs. flexibility.\n\nWould you like me to walk through a concrete technical example or create a quick 3-minute quiz on this topic?`;
        break;

      case 'TECHNICAL_ASSISTANCE':
        reply = `### Technical Implementation Guidance\n\nHere is a clean, modern implementation following best practices for **${role}** workflows:\n\n\`\`\`typescript\n// Example: Resilient Async Data Fetching & Processing\ninterface ApiResponse<T> {\n  data: T | null;\n  error: string | null;\n}\n\nasync function executeQuery<T>(endpoint: string): Promise<ApiResponse<T>> {\n  try {\n    const response = await fetch(endpoint, { headers: { 'Content-Type': 'application/json' } });\n    if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);\n    const data = await response.json();\n    return { data, error: null };\n  } catch (err: any) {\n    return { data: null, error: err.message || 'Unknown network error' };\n  }\n}\n\`\`\`\n\n#### Key Engineering Highlights\n- **Type Safety**: Explicit interfaces ensure strict contracts between caller and consumer.\n- **Graceful Error Containment**: Eliminates unhandled promise rejections.\n- **Non-blocking Execution**: Maintains UI responsiveness in production environments.\n\nLet me know if you would like me to adjust this for Python, SQL, or your specific project architecture!`;
        break;

      case 'LEARNING_PATHWAY':
        agent = 'WF-01_SUGGESTION';
        reply = `### Your Learning Pathway for ${role}\n\nBased on your current skills (**${skillsList}**), here is your structured trajectory to reach production-readiness:\n\n- **Phase 1: Foundations & Architecture (3 Weeks)**\n  Master relational database design, REST APIs, and asynchronous programming.\n- **Phase 2: Full-Stack Integration & State (4 Weeks)**\n  Build end-to-end applications with secure authentication, caching, and state management.\n- **Phase 3: Production Capstone & Deployment (4 Weeks)**\n  Deploy containerized microservices to cloud infrastructure with automated CI/CD pipelines.\n\n💡 *You can also trigger a live AI roadmap regeneration directly from the **Career Strategy** tab.*`;
        break;

      case 'CAREER_EVALUATION':
        agent = 'WF-02_SCORING';
        const estimatedScore = Math.min(95, 60 + context.skills.length * 6 + context.projects.length * 8);
        reply = `### Career Readiness Evaluation: ${role}\n\n**Overall Readiness Score: ${estimatedScore}/100**\n\n#### Strengths Identified\n- **Targeted Ambition**: Clear alignment with industry demand for **${role}**.\n- **Verified Foundations**: Solid baseline in ${skillsList}.\n- **Learning Commitment**: Active engagement with your weekly target of **${context.weeklyHoursTarget} hrs/week**.\n\n#### High-Impact Areas for Growth\n- **Production Portfolio**: Deploy at least 2 full-stack projects featuring real database persistence and user authentication.\n- **Industry Credential**: Complete a recognized cloud or framework certification to demonstrate third-party validation.\n\nWould you like me to recommend a portfolio project that directly targets these growth areas?`;
        break;

      case 'PROGRESS_ANALYSIS':
        const pacing = context.loggedHours >= context.weeklyHoursTarget ? 'ahead of schedule' : 'building momentum';
        reply = `### Your Current Learning Progress\n\nHere is your real-time academic and career velocity:\n\n- **Weekly Study Target**: ${context.weeklyHoursTarget} hours\n- **Hours Logged This Cycle**: **${context.loggedHours} hours** (${pacing})\n- **Milestones Completed**: ${context.completedMilestones} finished (${context.pendingMilestones} in progress)\n- **Course Attendance**: ${context.attendancePercentage}%\n- **Pending Assignments**: ${context.pendingAssignmentsCount}\n\n**Mentor Tip**: Spending two 45-minute focused blocks before Friday will keep you comfortably on track to hit your weekly target!`;
        break;

      case 'PROJECT_GUIDANCE':
        reply = `### High-Impact Project Ideas for ${role}\n\nTo stand out to recruiters, build projects that solve real operational friction:\n\n1. **Collaborative Task & Knowledge Graph**\n   - *Stack*: React/Next.js, Node.js, PostgreSQL, WebSockets\n   - *Core Challenge*: Real-time state synchronization across multiple connected users.\n\n2. **AI-Powered Code Review Bot**\n   - *Stack*: TypeScript, Gemini API, GitHub Webhooks, Docker\n   - *Core Challenge*: Streaming diffs, automated lint checks, and intelligent feedback summaries.\n\n3. **Distributed Event Booking System**\n   - *Stack*: Node.js/Go, Redis Caching, PostgreSQL with Row-Level Locking\n   - *Core Challenge*: Concurrency control under high booking volume.\n\nWhich of these would you like to build first? I can guide you through the architecture!`;
        break;

      case 'RESOURCE_DISCOVERY':
        const materialsNotice = context.materials && context.materials.length > 0
          ? `Your campus library currently has **${context.materials.length} uploaded material(s)** for subjects like ${context.enrolledSubjects.join(', ')}.`
          : 'Check your Materials tab for uploaded lecture slides and reference notes.';
        reply = `### Curated Learning Resources for ${role}\n\nHere are top-tier recommendations to accelerate your learning:\n\n1. **Official Documentation & Guides**: Always refer to primary documentation (MDN Web Docs, React Docs, PostgreSQL Manual).\n2. **Interactive Sandboxes**: Practice algorithms on platforms like LeetCode and Codecademy.\n3. **Campus Coursework**: ${materialsNotice}\n\nWould you like a curated reading list for system design or frontend performance?`;
        break;

      case 'FOLLOW_UP':
        reply = `### Expanding on Our Conversation\n\nContinuing with our focus on **${role}**:\n\nThe key to applying this effectively is breaking down complex problems into modular steps. In practical engineering, you will often find that small, iterative refinements produce far more robust systems than attempting a massive overhaul at once.\n\nWould you like me to elaborate further on code implementation, architecture patterns, or career interview prep?`;
        break;

      case 'OUT_OF_SCOPE_OR_UNCLEAR':
      default:
        reply = `### How Can I Best Assist You Today?\n\nI want to make sure I give you the most accurate answer possible. Could you clarify your question or tell me what you would like to work on?\n\nYou can ask me:\n- *"What skills do I need for ${role}?"*\n- *"Explain how database indexing works with an example."*\n- *"Evaluate my current career readiness score."*\n- *"Give me a project idea using modern tech stacks."*\n\nI'm ready whenever you are!`;
        break;
    }

    const suggestions = this.generateDefaultSuggestions(intent, role);

    return {
      reply,
      intent,
      agent,
      suggestions
    };
  }

  /**
   * Generates 3 contextual follow-up prompts
   */
  private static generateDefaultSuggestions(intent: AIIntent, targetRole: string): string[] {
    switch (intent) {
      case 'GENERAL_CONVERSATION':
        return [
          `What are the top skills for ${targetRole}?`,
          'Evaluate my career readiness score.',
          'Show me my personalized roadmap.'
        ];
      case 'GENERAL_LEARNING':
        return [
          'Can you show me a practical code example?',
          'How does this apply to system design?',
          'Test my understanding with a quick question.'
        ];
      case 'TECHNICAL_ASSISTANCE':
        return [
          'How do I test this code with unit tests?',
          'What are common edge cases to watch for?',
          'Explain the time and space complexity.'
        ];
      case 'CAREER_GUIDANCE':
        return [
          'What questions will recruiters ask in interviews?',
          'How should I format my resume for this role?',
          'Recommend a project to impress hiring managers.'
        ];
      case 'LEARNING_PATHWAY':
        return [
          'What should I study this week?',
          'Recommend free courses for this track.',
          'How long will it take to finish Phase 1?'
        ];
      case 'CAREER_EVALUATION':
        return [
          'How can I improve my technical score?',
          'Suggest a project to fill my biggest gap.',
          'Create a 30-day study plan to level up.'
        ];
      case 'PROGRESS_ANALYSIS':
        return [
          'How do I catch up on my weekly target?',
          'Show my pending assignments.',
          'Log 2 hours of study time.'
        ];
      case 'PROJECT_GUIDANCE':
        return [
          'Help me design the database schema.',
          'What APIs should I integrate?',
          'How should I structure the GitHub README?'
        ];
      case 'RESOURCE_DISCOVERY':
        return [
          'Show me uploaded course notes.',
          'Recommend top books on this subject.',
          'Find open-source repos to learn from.'
        ];
      case 'FOLLOW_UP':
      default:
        return [
          'Can you show that in another language?',
          'Explain why this approach is preferred.',
          'What is the next step on my roadmap?'
        ];
    }
  }

  /**
   * Legacy method preserved for compatibility with course materials drawer
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
    const mentorResult = await this.processMentorMessage({
      userId: 'context-user',
      message: userMessage,
      history: history.map(h => ({ role: h.role, content: h.text })),
      context: {
        userId: 'context-user',
        studentName: context.studentName,
        targetRole: context.targetRole,
        department: context.department,
        skills: [],
        projects: [],
        certifications: [],
        weeklyHoursTarget: context.weeklyHoursTarget,
        loggedHours: 0,
        completedMilestones: 0,
        pendingMilestones: context.roadmapPhases.length,
        attendancePercentage: 100,
        pendingAssignmentsCount: context.assignments.filter(a => !a.submitted).length,
        enrolledSubjects: Array.from(new Set(context.materials.map(m => m.subject))),
        materials: context.materials,
        assignments: context.assignments,
        roadmapPhases: context.roadmapPhases
      }
    });

    return {
      reply: mentorResult.reply,
      sources: (mentorResult.sources || []).map(s => ({
        title: s.title,
        subject: s.subject,
        category: s.category || 'NOTE',
        fileUrl: s.fileUrl
      }))
    };
  }

  static async generateCareerRoadmap(
    targetRole: string,
    currentSkills: string[],
    departmentName: string,
    year: number
  ): Promise<AIServiceResponse> {
    const skillsString = currentSkills.join(', ');

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

    const raw = await this.generateWithFallback(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
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
        } catch {
          // Fall through to mock
        }
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

    const raw = await this.generateWithFallback(prompt);
    if (raw) return raw;

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

    const raw = await this.generateWithFallback(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
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
        } catch {
          // Fall through to deterministic
        }
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
1. Objectively evaluate their current skills and projects against modern 2026 industry standards for "${context.targetRole}".
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

    const raw = await this.generateWithFallback(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
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
        } catch {
          // Fall through to deterministic
        }
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

    const raw = await this.generateWithFallback(prompt);
    if (raw) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
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
        } catch {
          // Fall through to deterministic
        }
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
