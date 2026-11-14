'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User as UserIcon, BookOpen, Layers, Cpu, Users, Megaphone, Calendar, 
  MessageSquare, Send, CheckCircle2, AlertTriangle, LogOut, ArrowUpRight, Plus, 
  ShieldAlert, Award, Briefcase, Target, Compass, BarChart3, TrendingUp, 
  Sparkles, Trash2, Edit3, ExternalLink, Check, ChevronRight, ChevronLeft, 
  ShieldCheck, Zap, RefreshCw, Clock, Globe, Code, FileText,
  X, RotateCcw, Sliders, Info, CheckCircle, GraduationCap, CheckSquare, HelpCircle,
  Settings, Heart, Star, ChevronDown, Filter, LayoutGrid, Bookmark
} from 'lucide-react';
import { 
  skillsService, certificationsService, projectsService, 
  careerService, agentService, onboardingService, completeOnboarding,
  mentorService, trackerService, chatService 
} from '@/services';

type DashboardTab = 
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

export default function StudentDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>('OVERVIEW');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // SkillPath AI State
  const [skillPathData, setSkillPathData] = useState<any>(null);
  const [runningAgent, setRunningAgent] = useState<'WF-01' | 'WF-02' | null>(null);

  // Academic Modules State
  const [metrics, setMetrics] = useState<any>({ attendancePercentage: 0, pendingAssignments: 0, registeredEvents: 0, announcements: [] });
  const [attendance, setAttendance] = useState<any>({ overallPercentage: 0, subjects: [] });
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Multi-step Onboarding State (7 Steps)
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  // Step 1: Personal
  const [obPersonal, setObPersonal] = useState({
    fullName: '',
    college: 'Apex Institute of Technology',
    department: 'Computer Science & Engineering',
    educationLevel: 'Undergraduate (B.Tech)',
    graduationYear: '2026',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: ''
  });

  // Step 2: Interests & Preferences
  const [obPreferences, setObPreferences] = useState({
    weeklyHours: 12,
    preferredLearningStyle: 'Practical projects',
    courseTypePreference: 'Open to both free & premium',
    preferredLanguage: 'English'
  });
  const [obInterests, setObInterests] = useState<string[]>([
    'Web Architecture', 'Artificial Intelligence', 'Cloud Infrastructure'
  ]);

  // Step 3: Skills
  const [obSkills, setObSkills] = useState<Array<{ name: string; proficiency: string; source: string }>>([
    { name: 'TypeScript', proficiency: 'Intermediate', source: 'Self-learning' },
    { name: 'React', proficiency: 'Advanced', source: 'Personal project' },
    { name: 'Node.js', proficiency: 'Intermediate', source: 'College coursework' }
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('Intermediate');
  const [newSkillSource, setNewSkillSource] = useState('Self-learning');

  // Step 4: Certifications
  const [obCerts, setObCerts] = useState<Array<{ name: string; issuingOrg: string; credentialId: string; credentialUrl: string; issueDate: string }>>([]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertOrg, setNewCertOrg] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');

  // Step 5: Projects
  const [obProjects, setObProjects] = useState<Array<{ name: string; description: string; technologies: string; category: string; githubUrl: string; liveUrl: string; outcomes: string; projectType: string }>>([]);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjGit, setNewProjGit] = useState('');

  // Step 6: Career Goals
  const [obCareer, setObCareer] = useState({
    primaryRole: 'Full Stack Developer',
    secondaryRole: 'Cloud / DevOps Engineer',
    targetIndustry: 'Software Products & SaaS',
    targetDate: '6 Months',
    reason: 'Passionate about building scalable full-stack applications.',
    confidenceLevel: 'High'
  });

  // Modal / Quick action states
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showAddProjModal, setShowAddProjModal] = useState(false);

  // Coordinated Feature 1: Chat Agent State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'USER' | 'AI';
    text: string;
    sources?: Array<{ title: string; subject: string; category: string; fileUrl?: string }>;
    timestamp: string;
    isError?: boolean;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  // Coordinated Feature 2: AI Mentor State
  const [mentorRecs, setMentorRecs] = useState<any[]>([]);
  const [mentorContext, setMentorContext] = useState<any>(null);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [dismissedRecIds, setDismissedRecIds] = useState<string[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);
  const [acceptedRecIds, setAcceptedRecIds] = useState<string[]>([]);
  const [adjustModalRec, setAdjustModalRec] = useState<any | null>(null);
  const [adjustTimeframe, setAdjustTimeframe] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [mentorFilterCategory, setMentorFilterCategory] = useState<string>('ALL');

  // Coordinated Feature 3: Learning Tracker State
  const [trackerData, setTrackerData] = useState<any>(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [logHoursModalOpen, setLogHoursModalOpen] = useState(false);
  const [hoursInput, setHoursInput] = useState(2);
  const [logTopicInput, setLogTopicInput] = useState('');
  const [loggingHours, setLoggingHours] = useState(false);
  const [toggleMilestoneLoading, setToggleMilestoneLoading] = useState<number | null>(null);

  // Redesign Visual & Filter States (Reference Screenshot)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All Subjects');
  const [showMoreTabsMenu, setShowMoreTabsMenu] = useState(false);
  const [activityTimeframe, setActivityTimeframe] = useState<'Week' | 'Year'>('Week');

  const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderFormattedMessage = (content: string) => {
    const lines = (content || '').split('\n');
    return (
      <div className="space-y-1.5 text-xs font-normal">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1" />;

          if (trimmed.startsWith('### ')) {
            return <h4 key={lIdx} className="font-serif font-black text-xs text-[#252820] mt-1.5 mb-0.5">{trimmed.replace(/^###\s+/, '')}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={lIdx} className="font-serif font-black text-sm text-[#252820] mt-2 mb-1">{trimmed.replace(/^##\s+/, '')}</h3>;
          }

          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
          const textToRender = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed;
          const parts = textToRender.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-black text-[#252820]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="px-1 py-0.5 bg-[#E5E1D8]/60 text-[#252820] rounded font-mono text-[11px]">{part.slice(1, -1)}</code>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                <span className="text-[#426B52] font-black text-xs mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{renderedLine}</span>
              </div>
            );
          }

          return <p key={lIdx} className="leading-relaxed">{renderedLine}</p>;
        })}
      </div>
    );
  };

  const enrolledSubjectList = React.useMemo(() => {
    const set = new Set<string>();
    (attendance?.subjects || []).forEach((s: any) => { if (s.subjectName) set.add(s.subjectName); });
    (materials || []).forEach((m: any) => { if (m.subject?.name) set.add(m.subject.name); });
    (assignments || []).forEach((a: any) => { if (a.subject?.name) set.add(a.subject.name); });
    return ['All Subjects', ...Array.from(set)];
  }, [attendance, materials, assignments]);

  // Academic Action States
  const [submittingFileId, setSubmittingFileId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [peerRoll, setPeerRoll] = useState('');
  const [connectingPeer, setConnectingPeer] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const json = await res.json();
      if (json.success) setDepartments(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.success) {
        router.push('/login');
      } else {
        setUser(json.user);
        setObPersonal(prev => ({
          ...prev,
          fullName: json.user.name || '',
          department: json.user.studentDetails?.department || prev.department
        }));
        await loadAllDashboardData();
      }
    } catch {
      router.push('/login');
    }
  };

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, mRes, aRes, matRes, asRes, connRes, mentorRes, trackerRes] = await Promise.all([
        fetch('/api/skillpath/overview').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/dashboard').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/attendance').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/materials').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/assignments').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/connections').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/mentor').then(r => r.json()).catch(() => ({})),
        fetch('/api/student/tracker').then(r => r.json()).catch(() => ({}))
      ]);

      if (overviewRes.success) {
        setSkillPathData(overviewRes.data);
        if (overviewRes.data.profile) {
          setObPersonal(prev => ({
            ...prev,
            fullName: overviewRes.data.profile.fullName || prev.fullName,
            college: overviewRes.data.profile.college || prev.college,
            department: overviewRes.data.profile.department || prev.department,
            educationLevel: overviewRes.data.profile.educationLevel || prev.educationLevel,
            graduationYear: overviewRes.data.profile.graduationYear || prev.graduationYear,
            linkedinUrl: overviewRes.data.profile.linkedinUrl || '',
            githubUrl: overviewRes.data.profile.githubUrl || '',
            portfolioUrl: overviewRes.data.profile.portfolioUrl || ''
          }));
        }
      }

      if (mRes.success) setMetrics(mRes.data);
      if (aRes.success) setAttendance(aRes.data);
      if (matRes.success) setMaterials(matRes.data);
      if (asRes.success) setAssignments(asRes.data);
      if (connRes.success) setConnections(connRes.data);
      if (mentorRes.success && mentorRes.data?.recommendations) {
        setMentorRecs(mentorRes.data.recommendations);
        setMentorContext(mentorRes.data.context);
      }
      if (trackerRes.success && trackerRes.data) {
        setTrackerData(trackerRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorData = async () => {
    setMentorLoading(true);
    try {
      const data = await mentorService.getRecommendations();
      if (data?.recommendations) {
        setMentorRecs(data.recommendations);
        setMentorContext(data.context);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMentorLoading(false);
    }
  };

  const fetchTrackerData = async () => {
    setTrackerLoading(true);
    try {
      const data = await trackerService.getMetrics();
      if (data) {
        setTrackerData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTrackerLoading(false);
    }
  };

  // Multi-step Onboarding Submit (Step 7)
  const handleFinalOnboardingSubmit = async () => {
    setOnboardSubmitting(true);
    setOnboardError('');

    try {
      const payload = {
        profile: {
          fullName: obPersonal.fullName,
          full_name: obPersonal.fullName,
          college: obPersonal.college,
          department: obPersonal.department,
          educationLevel: obPersonal.educationLevel,
          education_level: obPersonal.educationLevel,
          graduationYear: obPersonal.graduationYear,
          graduation_year: obPersonal.graduationYear,
          linkedinUrl: obPersonal.linkedinUrl,
          linkedin_url: obPersonal.linkedinUrl,
          githubUrl: obPersonal.githubUrl,
          github_url: obPersonal.githubUrl,
          portfolioUrl: obPersonal.portfolioUrl,
          portfolio_url: obPersonal.portfolioUrl
        },
        preferences: {
          weeklyHours: obPreferences.weeklyHours,
          weekly_hours: obPreferences.weeklyHours,
          preferredLearningStyle: obPreferences.preferredLearningStyle,
          preferred_learning_style: obPreferences.preferredLearningStyle,
          courseTypePreference: obPreferences.courseTypePreference,
          course_type_preference: obPreferences.courseTypePreference,
          preferredLanguage: obPreferences.preferredLanguage,
          preferred_language: obPreferences.preferredLanguage
        },
        interests: obInterests.map(domain => ({ domain, exploration_areas: [] })),
        skills: obSkills.map(s => ({
          name: s.name,
          skill_name: s.name,
          proficiency: s.proficiency,
          source: s.source
        })),
        certifications: obCerts.map(c => ({
          name: c.name,
          issuing_org: c.issuingOrg,
          credential_id: c.credentialId,
          credential_url: c.credentialUrl,
          issue_date: c.issueDate
        })),
        projects: obProjects.map(p => ({
          name: p.name,
          description: p.description,
          technologies: p.technologies,
          category: p.category,
          github_url: p.githubUrl,
          project_type: p.projectType
        })),
        careerGoal: {
          primaryRole: obCareer.primaryRole,
          primary_role: obCareer.primaryRole,
          secondaryRole: obCareer.secondaryRole,
          secondary_role: obCareer.secondaryRole,
          targetIndustry: obCareer.targetIndustry,
          target_industry: obCareer.targetIndustry,
          targetDate: obCareer.targetDate,
          target_date: obCareer.targetDate,
          reason: obCareer.reason,
          confidenceLevel: obCareer.confidenceLevel,
          confidence_level: obCareer.confidenceLevel
        }
      };

      await completeOnboarding(payload);
      await loadAllDashboardData();
      setTab('OVERVIEW');
    } catch (err: any) {
      setOnboardError(err.message || 'A network error occurred during submission.');
    } finally {
      setOnboardSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Add / Remove Onboard Skills
  const addOnboardSkill = () => {
    if (!newSkillInput.trim()) return;
    setObSkills(prev => [
      ...prev,
      { name: newSkillInput.trim(), proficiency: newSkillProf, source: newSkillSource }
    ]);
    setNewSkillInput('');
  };

  const removeOnboardSkill = (index: number) => {
    setObSkills(prev => prev.filter((_, i) => i !== index));
  };

  // Add / Remove Onboard Cert
  const addOnboardCert = () => {
    if (!newCertName.trim()) return;
    setObCerts(prev => [
      ...prev,
      { name: newCertName.trim(), issuingOrg: newCertOrg.trim() || 'Coursera / AWS', credentialId: `ID-${Date.now().toString().slice(-6)}`, credentialUrl: newCertUrl.trim(), issueDate: '2026' }
    ]);
    setNewCertName('');
    setNewCertOrg('');
    setNewCertUrl('');
  };

  // Add / Remove Onboard Project
  const addOnboardProject = () => {
    if (!newProjName.trim()) return;
    setObProjects(prev => [
      ...prev,
      {
        name: newProjName.trim(),
        description: newProjDesc.trim() || 'A high-impact functional application.',
        technologies: newProjTech.trim() || 'React, TypeScript, SQLite',
        category: 'Full Stack',
        githubUrl: newProjGit.trim() || '',
        liveUrl: '',
        outcomes: 'Deployed and tested production build',
        projectType: 'Individual'
      }
    ]);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
    setNewProjGit('');
  };

  // Agent Triggers
  const handleRunSuggestionAgent = async () => {
    setRunningAgent('WF-01');
    try {
      await agentService.runSuggestionAgent(skillPathData?.currentCareerGoal?.primaryRole);
      await loadAllDashboardData();
      setTab('ROADMAP');
    } catch (err: any) {
      console.error('[WF-01 error]:', err);
      alert(err.message || 'We could not generate your roadmap right now. Please try again.');
    } finally {
      setRunningAgent(null);
    }
  };

  const handleRunScoringAgent = async () => {
    setRunningAgent('WF-02');
    try {
      await agentService.runScoringAgent();
      await loadAllDashboardData();
      setTab('EVALUATION');
    } catch (err: any) {
      console.error('[WF-02 error]:', err);
      alert(err.message || 'We could not evaluate your profile right now. Please try again.');
    } finally {
      setRunningAgent(null);
    }
  };

  // Coordinated Feature 1: Chat Agent Handlers
  const handleSendChatMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim() || chatSending) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'USER' as const,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatSending(true);
    setChatError(null);
    setLastFailedPrompt(null);

    const historyPayload = chatMessages.slice(-6).map(m => ({
      role: m.sender === 'USER' ? 'user' : 'model',
      text: m.text
    }));

    try {
      const res = await chatService.askQuestion(userMsg.text, historyPayload);
      if (res.success && res.data) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now() + 1}`,
            sender: 'AI',
            text: res.data.reply,
            sources: res.data.sources || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(res.error?.message || 'Chat service response error');
      }
    } catch {
      setChatError('Unable to fetch response from Course Assistant. Please check connectivity.');
      setLastFailedPrompt(userMsg.text);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'AI',
          text: 'I could not process this question against the course repository right now. Please click retry below.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleRetryChat = () => {
    if (lastFailedPrompt) {
      handleSendChatMessage(lastFailedPrompt);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setChatError(null);
    setLastFailedPrompt(null);
  };

  // Coordinated Feature 2: AI Mentor Handlers
  const handleDismissRec = async (id: string) => {
    setDismissedRecIds(prev => [...prev, id]);
    try {
      await mentorService.dismissRecommendation(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRestoreRec = (id: string) => {
    setDismissedRecIds(prev => prev.filter(rId => rId !== id));
  };

  const handleAcceptRec = (id: string) => {
    setAcceptedRecIds(prev => [...prev, id]);
  };

  const handleOpenAdjust = (rec: any) => {
    setAdjustModalRec(rec);
    setAdjustTimeframe(rec.timeframe || 'This Week');
    setAdjustNotes('');
  };

  const handleSaveAdjust = async () => {
    if (!adjustModalRec) return;
    const recId = adjustModalRec.id;
    setMentorRecs(prev => prev.map(r => r.id === recId ? { 
      ...r, 
      timeframe: adjustTimeframe, 
      description: adjustNotes ? `${r.description} (Learner note: ${adjustNotes})` : r.description 
    } : r));
    setAcceptedRecIds(prev => [...prev, recId]);
    await mentorService.adjustRecommendation(recId, { timeframe: adjustTimeframe, notes: adjustNotes }).catch(console.error);
    setAdjustModalRec(null);
  };

  // Coordinated Feature 3: Learning Tracker Handlers
  const handleLogStudyHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingHours(true);
    try {
      await trackerService.logStudyHours(hoursInput);
      setLogHoursModalOpen(false);
      setHoursInput(2);
      setLogTopicInput('');
      await Promise.all([fetchTrackerData(), loadAllDashboardData()]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingHours(false);
    }
  };

  const handleTogglePhase = async (phaseNumber: number, currentStatus: string) => {
    setToggleMilestoneLoading(phaseNumber);
    try {
      await trackerService.toggleMilestone(phaseNumber, currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED');
      await Promise.all([fetchTrackerData(), loadAllDashboardData()]);
    } catch (e) {
      console.error(e);
    } finally {
      setToggleMilestoneLoading(null);
    }
  };

  // Academic Actions
  const submitAssignment = async (assignmentId: string) => {
    if (!fileUrl) return;
    try {
      await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });
      setFileUrl('');
      setSubmittingFileId(null);
      loadAllDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const requestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectingPeer(true);
    try {
      await fetch('/api/student/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerRoll })
      });
      setPeerRoll('');
      loadAllDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingPeer(false);
    }
  };

  const acceptConnection = async (connId: string) => {
    try {
      await fetch(`/api/student/connections/${connId}/accept`, { method: 'POST' });
      loadAllDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F6F4EF] flex items-center justify-center font-bold text-[#72766B] animate-pulse text-sm">
        <Sparkles className="w-5 h-5 text-[#426B52] mr-2 animate-spin" />
        Syncing GoWithFlow Intelligence Nodes...
      </div>
    );
  }

  // Determine whether user needs first-time 7-step onboarding
  const isOnboardingIncomplete = !skillPathData?.profile || skillPathData?.profile?.onboardingStatus !== 'COMPLETED';

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#252820] relative selection:bg-[#A8B99A]/40 font-sans p-2 sm:p-4 md:p-6 lg:p-7">
      
      {/* ========================================================= */}
      {/* 6. PROFESSIONAL MULTI-STEP ONBOARDING WIZARD OVERLAY     */}
      {/* ========================================================= */}
      {isOnboardingIncomplete && (
        <div className="fixed inset-0 bg-[#252820]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFEFC] border border-[#E5E1D8] max-w-2xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
            
            {/* Header with Step Progress */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#426B52] rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#252820]">GoWithFlow Onboarding</h2>
                  <p className="text-xs text-[#72766B]">Step {onboardStep} of 7: {
                    onboardStep === 1 ? 'Personal Information' :
                    onboardStep === 2 ? 'Interests & Learning Preferences' :
                    onboardStep === 3 ? 'Existing Skills' :
                    onboardStep === 4 ? 'Certifications' :
                    onboardStep === 5 ? 'Projects' :
                    onboardStep === 6 ? 'Career Goals' : 'Profile Review & Submit'
                  }</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-[#426B52] bg-[#A8B99A]/20 px-2.5 py-1 rounded-full border border-[#A8B99A]/40">
                  {Math.round((onboardStep / 7) * 100)}%
                </span>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="flex gap-1.5 mb-6">
              {[1, 2, 3, 4, 5, 6, 7].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    s <= onboardStep ? 'bg-[#426B52]' : 'bg-[#E5E1D8]'
                  }`}
                />
              ))}
            </div>

            {onboardError && (
              <div className="mb-4 p-3 bg-[#C77952]/10 border border-[#C77952]/30 text-[#C77952] text-xs font-semibold rounded-xl">
                {onboardError}
              </div>
            )}

            {/* STEP 1: Personal Info */}
            {onboardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">What is your full name?</label>
                  <input
                    type="text"
                    required
                    value={obPersonal.fullName}
                    onChange={(e) => setObPersonal({ ...obPersonal, fullName: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-4 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] placeholder-[#72766B]/60 focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">College / Organization</label>
                    <input
                      type="text"
                      value={obPersonal.college}
                      onChange={(e) => setObPersonal({ ...obPersonal, college: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Department</label>
                    <input
                      type="text"
                      value={obPersonal.department}
                      onChange={(e) => setObPersonal({ ...obPersonal, department: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Current Education Level</label>
                    <input
                      type="text"
                      value={obPersonal.educationLevel}
                      onChange={(e) => setObPersonal({ ...obPersonal, educationLevel: e.target.value })}
                      placeholder="e.g. B.Tech / Masters"
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Graduation Year</label>
                    <input
                      type="text"
                      value={obPersonal.graduationYear}
                      onChange={(e) => setObPersonal({ ...obPersonal, graduationYear: e.target.value })}
                      placeholder="2026"
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={obPersonal.linkedinUrl}
                      onChange={(e) => setObPersonal({ ...obPersonal, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">GitHub URL</label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={obPersonal.githubUrl}
                      onChange={(e) => setObPersonal({ ...obPersonal, githubUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Portfolio Website</label>
                    <input
                      type="url"
                      placeholder="https://myportfolio.dev"
                      value={obPersonal.portfolioUrl}
                      onChange={(e) => setObPersonal({ ...obPersonal, portfolioUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Interests & Preferences */}
            {onboardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-2">Which technology domains interest you most?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Web Architecture', 'Artificial Intelligence', 'Data Science', 'Cloud & DevOps', 'Cybersecurity', 'Mobile Engineering', 'Blockchain'].map(dom => {
                      const selected = obInterests.includes(dom);
                      return (
                        <button
                          type="button"
                          key={dom}
                          onClick={() => {
                            setObInterests(prev => selected ? prev.filter(d => d !== dom) : [...prev, dom]);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            selected 
                              ? 'bg-[#426B52] text-white border-[#426B52]' 
                              : 'bg-[#F6F4EF] border-[#E5E1D8] text-[#252820] hover:bg-[#E5E1D8]/40'
                          }`}
                        >
                          {dom} {selected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Weekly Learning Commitment (Hours)</label>
                    <input
                      type="number"
                      min={2}
                      max={60}
                      value={obPreferences.weeklyHours}
                      onChange={(e) => setObPreferences({ ...obPreferences, weeklyHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Preferred Learning Style</label>
                    <select
                      value={obPreferences.preferredLearningStyle}
                      onChange={(e) => setObPreferences({ ...obPreferences, preferredLearningStyle: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    >
                      <option>Practical projects</option>
                      <option>Video tutorials</option>
                      <option>Documentation</option>
                      <option>Interactive exercises</option>
                      <option>A combination of methods</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Resource Preference</label>
                    <select
                      value={obPreferences.courseTypePreference}
                      onChange={(e) => setObPreferences({ ...obPreferences, courseTypePreference: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    >
                      <option>Strictly free resources</option>
                      <option>Open to both free & premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Instruction Language</label>
                    <input
                      type="text"
                      value={obPreferences.preferredLanguage}
                      onChange={(e) => setObPreferences({ ...obPreferences, preferredLanguage: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Existing Skills */}
            {onboardStep === 3 && (
              <div className="space-y-4">
                <div className="bg-[#F6F4EF] p-3.5 rounded-2xl border border-[#E5E1D8]">
                  <span className="text-xs font-bold text-[#252820] block mb-2">Add Your Existing Skill</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Next.js, Python, PostgreSQL"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                    <select
                      value={newSkillProf}
                      onChange={(e) => setNewSkillProf(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    >
                      <option>Beginner</option>
                      <option>Basic</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                      <option>Expert</option>
                    </select>
                    <select
                      value={newSkillSource}
                      onChange={(e) => setNewSkillSource(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    >
                      <option>Self-learning</option>
                      <option>College coursework</option>
                      <option>Certification</option>
                      <option>Personal project</option>
                      <option>Internship</option>
                      <option>Professional experience</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addOnboardSkill}
                    className="w-full py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    + Add Skill to Profile
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="block text-xs font-bold text-[#72766B]">Currently Added Skills ({obSkills.length})</label>
                  {obSkills.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-[#252820]">{s.name}</span>
                        <span className="text-[10px] bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/30 px-2 py-0.5 rounded ml-2 font-bold">{s.proficiency}</span>
                        <span className="text-[10px] text-[#72766B] ml-2">via {s.source}</span>
                      </div>
                      <button type="button" onClick={() => removeOnboardSkill(idx)} className="text-[#C77952] hover:opacity-80">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Certifications */}
            {onboardStep === 4 && (
              <div className="space-y-4">
                <div className="bg-[#F6F4EF] p-3.5 rounded-2xl border border-[#E5E1D8]">
                  <span className="text-xs font-bold text-[#252820] block mb-2">Add Earned Certification</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Certification Name (e.g. AWS Cloud Practitioner)"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                    <input
                      type="text"
                      placeholder="Issuing Org (e.g. Amazon Web Services)"
                      value={newCertOrg}
                      onChange={(e) => setNewCertOrg(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <input
                    type="url"
                    placeholder="Credential Verification URL"
                    value={newCertUrl}
                    onChange={(e) => setNewCertUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52] mb-2"
                  />
                  <button
                    type="button"
                    onClick={addOnboardCert}
                    className="w-full py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    + Add Certification
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#72766B]">Logged Certifications ({obCerts.length})</label>
                  {obCerts.length === 0 ? (
                    <p className="text-xs text-[#72766B] italic">No certifications added yet. You can proceed or add later.</p>
                  ) : (
                    obCerts.map((c, i) => (
                      <div key={i} className="p-2.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#252820]">{c.name}</span>
                          <span className="text-[10px] text-[#72766B] block">{c.issuingOrg}</span>
                        </div>
                        <span className="text-[10px] bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/30 px-2 py-0.5 rounded font-bold">Verified</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Projects */}
            {onboardStep === 5 && (
              <div className="space-y-4">
                <div className="bg-[#F6F4EF] p-3.5 rounded-2xl border border-[#E5E1D8]">
                  <span className="text-xs font-bold text-[#252820] block mb-2">Add Built Project</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Project Name (e.g. AI Content Planner)"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (e.g. Next.js, Prisma, Tailwind)"
                      value={newProjTech}
                      onChange={(e) => setNewProjTech(e.target.value)}
                      className="px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Short description of what you built"
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52] mb-2"
                  />
                  <input
                    type="url"
                    placeholder="GitHub repository link"
                    value={newProjGit}
                    onChange={(e) => setNewProjGit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52] mb-2"
                  />
                  <button
                    type="button"
                    onClick={addOnboardProject}
                    className="w-full py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    + Add Project to Showcase
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#72766B]">Showcase Projects ({obProjects.length})</label>
                  {obProjects.length === 0 ? (
                    <p className="text-xs text-[#72766B] italic">No projects added yet. Feel free to continue to next step.</p>
                  ) : (
                    obProjects.map((p, i) => (
                      <div key={i} className="p-2.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-xs">
                        <span className="font-bold text-[#252820]">{p.name}</span>
                        <span className="text-[10px] text-[#72766B] block">{p.technologies}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: Career Goals */}
            {onboardStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Primary Target Career Role</label>
                  <select
                    value={obCareer.primaryRole}
                    onChange={(e) => setObCareer({ ...obCareer, primaryRole: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  >
                    <option>Full Stack Developer</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>AI/ML Engineer</option>
                    <option>Data Scientist</option>
                    <option>Cloud Engineer</option>
                    <option>DevOps Engineer</option>
                    <option>Cybersecurity Analyst</option>
                    <option>Mobile App Developer</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Secondary Career Interest</label>
                    <input
                      type="text"
                      value={obCareer.secondaryRole}
                      onChange={(e) => setObCareer({ ...obCareer, secondaryRole: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#72766B] mb-1">Target Timeline</label>
                    <select
                      value={obCareer.targetDate}
                      onChange={(e) => setObCareer({ ...obCareer, targetDate: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                    >
                      <option>3 Months</option>
                      <option>6 Months</option>
                      <option>1 Year</option>
                      <option>Post Graduation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Why are you interested in this career?</label>
                  <textarea
                    rows={2}
                    value={obCareer.reason}
                    onChange={(e) => setObCareer({ ...obCareer, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
              </div>
            )}

            {/* STEP 7: Profile Review */}
            {onboardStep === 7 && (
              <div className="space-y-4">
                <div className="bg-[#A8B99A]/15 border border-[#A8B99A]/40 p-4 rounded-2xl text-center">
                  <h3 className="text-sm font-black text-[#426B52] mb-1">Your profile is ready!</h3>
                  <p className="text-xs text-[#252820]/80">
                    Let&apos;s build your personalized career journey with real-time AI roadmap matching and progress tracking.
                  </p>
                </div>

                <div className="space-y-2 text-xs bg-[#F6F4EF] p-4 rounded-2xl border border-[#E5E1D8]">
                  <div className="flex justify-between border-b border-[#E5E1D8] pb-2">
                    <span className="text-[#72766B]">Learner Name:</span>
                    <span className="font-bold text-[#252820]">{obPersonal.fullName || user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E1D8] pb-2">
                    <span className="text-[#72766B]">Target Role:</span>
                    <span className="font-bold text-[#426B52]">{obCareer.primaryRole}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E1D8] pb-2">
                    <span className="text-[#72766B]">Weekly Commitment:</span>
                    <span className="font-bold text-[#252820]">{obPreferences.weeklyHours} hrs/week</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E1D8] pb-2">
                    <span className="text-[#72766B]">Total Skills Registered:</span>
                    <span className="font-bold text-[#252820]">{obSkills.length} Skills</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#72766B]">Projects Showcase:</span>
                    <span className="font-bold text-[#252820]">{obProjects.length} Projects</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-[#E5E1D8] mt-6">
              {onboardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setOnboardStep(s => s - 1)}
                  className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] rounded-xl text-xs font-bold text-[#252820] flex items-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}

              {onboardStep < 7 ? (
                <button
                  type="button"
                  onClick={() => setOnboardStep(s => s + 1)}
                  className="px-5 py-2.5 bg-[#426B52] hover:bg-[#365843] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={onboardSubmitting}
                  onClick={handleFinalOnboardingSubmit}
                  className="px-6 py-2.5 bg-[#252820] hover:bg-[#34382D] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-colors"
                >
                  {onboardSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#A8B99A]" />
                      <span>Compiling GoWithFlow Nodes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#A8B99A]" />
                      <span>Complete My Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3-Column Layout Container (Reference Screenshot) */}
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-start w-full">

      {/* ========================================================= */}
      {/* 1. COMPACT ICON NAVIGATION DOCK (Editorial Reference Style) */}
      {/* ========================================================= */}
      <aside className="w-full lg:w-20 bg-[#FFFEFC] rounded-[28px] border border-[#E5E1D8] shadow-xs py-5 px-3 flex lg:flex-col justify-between items-center shrink-0 lg:min-h-[calc(100vh-56px)] lg:sticky lg:top-6 z-20">
        <div className="flex lg:flex-col items-center gap-4 w-full">
          {/* Top Brand Glyph (Warm terracotta/orange pill) */}
          <button
            onClick={() => setTab('OVERVIEW')}
            className="w-12 h-12 rounded-2xl bg-[#C77952]/15 text-[#C77952] flex items-center justify-center font-black shadow-xs hover:scale-105 active:scale-95 transition-transform"
            title="GoWithFlow Desk"
          >
            <Sparkles className="w-6 h-6" />
          </button>

          {/* Primary Icon Navigation Dock */}
          <nav className="flex lg:flex-col items-center gap-2 overflow-x-auto lg:overflow-visible w-full py-2">
            {[
              { id: 'OVERVIEW', icon: Layers, label: 'Overview Desk' },
              { id: 'AI_MENTOR', icon: Sparkles, label: 'AI Mentor' },
              { id: 'PROGRESS', icon: TrendingUp, label: 'Learning Tracker' },
              { id: 'MATERIALS', icon: BookOpen, label: 'Study Materials' },
              { id: 'ASSIGNMENTS', icon: Calendar, label: 'Assignments' },
              { id: 'SKILLS', icon: Code, label: `Skills (${skillPathData?.skills?.length || 0})` },
              { id: 'ATTENDANCE', icon: CheckCircle2, label: 'Attendance Ledger' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => {
                      setTab(item.id as DashboardTab);
                      setShowMoreTabsMenu(false);
                    }}
                    aria-label={item.label}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#426B52] text-white shadow-xs ring-4 ring-[#426B52]/15 scale-105'
                        : 'text-[#72766B] hover:text-[#252820] hover:bg-[#F6F4EF]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#252820] text-[#FFFEFC] text-[11px] font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden lg:block">
                    {item.label}
                  </div>
                </div>
              );
            })}

            {/* More Tabs Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMoreTabsMenu(!showMoreTabsMenu)}
                aria-label="More Learning Modules"
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  ['PROFILE', 'CERTIFICATIONS', 'PROJECTS', 'CAREER_GOALS', 'ROADMAP', 'EVALUATION', 'CONNECTIONS'].includes(tab)
                    ? 'bg-[#C77952] text-white shadow-xs ring-4 ring-[#C77952]/15 scale-105'
                    : 'text-[#72766B] hover:text-[#252820] hover:bg-[#F6F4EF]'
                }`}
                title="More Modules"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              {/* Popover Menu with remaining modules */}
              {showMoreTabsMenu && (
                <div className="absolute left-0 lg:left-full top-full lg:top-0 ml-0 lg:ml-3 mt-2 lg:mt-0 w-52 bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs font-bold text-[#252820]">
                  <div className="text-[10px] text-[#72766B] uppercase tracking-wider px-2.5 py-1 border-b border-[#E5E1D8]">
                    More Modules
                  </div>
                  {[
                    { id: 'ROADMAP', icon: Compass, label: 'Learning Roadmap' },
                    { id: 'EVALUATION', icon: BarChart3, label: 'Career Evaluation' },
                    { id: 'CERTIFICATIONS', icon: Award, label: `Certifications (${skillPathData?.certifications?.length || 0})` },
                    { id: 'PROJECTS', icon: Briefcase, label: `Projects (${skillPathData?.projects?.length || 0})` },
                    { id: 'CAREER_GOALS', icon: Target, label: 'Career Goals' },
                    { id: 'CONNECTIONS', icon: Users, label: 'Campus Peers' },
                    { id: 'PROFILE', icon: UserIcon, label: 'My Profile' }
                  ].map(sec => {
                    const SecIcon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setTab(sec.id as DashboardTab);
                          setShowMoreTabsMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-colors ${
                          tab === sec.id ? 'bg-[#426B52] text-white' : 'hover:bg-[#F6F4EF]'
                        }`}
                      >
                        <SecIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom User Actions (Settings, Avatar, Logout) */}
        <div className="flex lg:flex-col items-center gap-3 pt-4 lg:border-t lg:border-[#E5E1D8]">
          <button
            onClick={() => setTab('PROFILE')}
            aria-label="Profile Settings"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              tab === 'PROFILE' ? 'bg-[#426B52] text-white' : 'text-[#72766B] hover:text-[#252820] hover:bg-[#F6F4EF]'
            }`}
            title="Settings & Profile"
          >
            <Settings className="w-4 h-4" />
          </button>

          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="avatar"
            onClick={() => setTab('PROFILE')}
            className="w-9 h-9 rounded-full border border-[#E5E1D8] object-cover cursor-pointer hover:ring-2 hover:ring-[#426B52]/40 transition-all"
            title={user.name}
          />

          <button
            onClick={handleLogout}
            aria-label="Sign Out"
            className="w-10 h-10 rounded-xl text-[#72766B] hover:text-[#C77952] hover:bg-[#C77952]/10 flex items-center justify-center transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT (Warm Paper #F6F4EF Background)     */}
      {/* ========================================================= */}
      <main className="flex-1 min-w-0 w-full space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* 1. GREETING & QUICK AI TRIGGER HEADER */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#252820] flex items-center gap-2">
                  Welcome Back, {user?.name?.split(' ')[0] || 'Learner'} <span className="inline-block hover:rotate-12 transition-transform duration-200">👋</span>
                </h1>
                <p className="text-xs text-[#72766B] mt-0.5 font-medium">
                  Your journey is moving forward &bull; Target Role: <strong className="text-[#252820] font-bold">{skillPathData?.currentCareerGoal?.primaryRole || 'Full Stack Developer'}</strong> &bull; Career Readiness: <span className="text-[#426B52] font-bold">{skillPathData?.latestScoringReport?.overallScore ? `${skillPathData.latestScoringReport.overallScore}%` : 'Pending'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setChatOpen(true)}
                  className="px-4 py-2 bg-[#FFFEFC] border border-[#E5E1D8] hover:border-[#426B52] text-[#252820] text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C77952]" />
                  <span>+ Ask AI</span>
                </button>
                <button
                  onClick={handleRunSuggestionAgent}
                  disabled={runningAgent === 'WF-01'}
                  className="px-3.5 py-2 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50"
                  title="Run automated suggestion agent"
                >
                  <Zap className="w-3 h-3 text-white" />
                  <span>{runningAgent === 'WF-01' ? 'Analyzing...' : 'Suggestions'}</span>
                </button>
              </div>
            </div>

            {/* 2. SUBJECT FILTER CHIPS (Reference Screenshot) */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {enrolledSubjectList.map((subject) => {
                const isSelected = selectedSubjectFilter === subject;
                const getSubjectVisual = (subj: string) => {
                  const s = subj.toLowerCase();
                  if (s.includes('all')) return { bg: 'bg-[#FDF1EB]', text: 'text-[#C77952]', glyph: '✦' };
                  if (s.includes('data') || s.includes('struct')) return { bg: 'bg-[#F3E8FF]', text: 'text-[#8B5CF6]', glyph: 'DS' };
                  if (s.includes('base') || s.includes('sql') || s.includes('db')) return { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', glyph: 'DB' };
                  if (s.includes('web') || s.includes('tech') || s.includes('react')) return { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', glyph: 'WT' };
                  if (s.includes('micro') || s.includes('os') || s.includes('sys')) return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', glyph: 'OS' };
                  return { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', glyph: subj.slice(0, 2).toUpperCase() };
                };
                const visual = getSubjectVisual(subject);

                return (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubjectFilter(subject)}
                    className={`px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-[#FFFEFC] border-[#252820] text-[#252820] shadow-xs ring-1 ring-[#252820]'
                        : 'bg-[#FFFEFC] border-[#E5E1D8] text-[#72766B] hover:text-[#252820] hover:border-[#D6D0C4]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg ${visual.bg} ${visual.text} flex items-center justify-center text-[10px] font-black`}>
                      {visual.glyph}
                    </span>
                    <span>{subject}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. YOUR UPCOMING CLASS SECTION (Reference Screenshot) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-serif font-black text-[#252820]">
                  Your Upcoming Class
                </h2>
                <button
                  onClick={() => setTab('ATTENDANCE')}
                  className="text-xs font-bold text-[#72766B] hover:text-[#426B52] transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              {attendance?.subjects?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendance.subjects.slice(0, 2).map((classItem: any, idx: number) => {
                    const isSage = idx % 2 === 0;
                    return (
                      <div
                        key={classItem.classSectionId || idx}
                        className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-[24px] p-3 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between"
                      >
                        {/* Top Illustrated Banner */}
                        <div
                          className={`${
                            isSage ? 'bg-[#E9F0E5]' : 'bg-[#FDF3E7]'
                          } rounded-[18px] p-3.5 h-28 relative overflow-hidden flex flex-col justify-between`}
                        >
                          <span className="bg-[#FFFEFC] border border-[#E5E1D8] text-[#252820] text-[10px] font-black px-2.5 py-1 rounded-full w-fit shadow-2xs">
                            Active Enrolled
                          </span>
                          {isSage ? (
                            <svg className="absolute right-3 -bottom-2 w-28 h-28 text-[#426B52]/25 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                              <path d="M50 95 C 48 60, 20 40, 10 30 C 30 25, 55 45, 50 95 Z" />
                              <path d="M50 75 C 55 50, 80 35, 90 25 C 75 22, 50 45, 50 75 Z" opacity="0.8" />
                              <path d="M49 98 L 51 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <circle cx="28" cy="32" r="5" fill="#A8B99A" opacity="0.6" />
                              <circle cx="75" cy="30" r="4" fill="#A8B99A" opacity="0.6" />
                            </svg>
                          ) : (
                            <svg className="absolute right-4 -bottom-1 w-24 h-24 text-[#C77952]/30 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M42 20 L58 20 M46 20 L46 42 L25 80 C22 86, 26 92, 33 92 L67 92 C74 92, 78 86, 75 80 L54 42 L54 20" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M30 75 Q 50 68, 70 75" stroke="#C77952" strokeWidth="2" opacity="0.5" fill="none" />
                              <circle cx="50" cy="80" r="3" fill="#C77952" opacity="0.4" />
                              <circle cx="42" cy="74" r="2" fill="#C77952" opacity="0.4" />
                              <circle cx="58" cy="72" r="2.5" fill="#C77952" opacity="0.4" />
                              <circle cx="50" cy="12" r="4" fill="#E0A96D" opacity="0.7" />
                            </svg>
                          )}
                        </div>

                        {/* Card Content & Action */}
                        <div className="p-2 pt-3 space-y-2">
                          <span className="text-[10px] font-bold text-[#72766B] border border-[#E5E1D8] bg-[#F6F4EF] px-2.5 py-0.5 rounded-full inline-block">
                            {classItem.subjectName}
                          </span>
                          <h3 className="font-extrabold text-sm text-[#252820] line-clamp-1">
                            {classItem.subjectName} — {classItem.facultyName ? `Prof. ${classItem.facultyName}` : 'Academic Module'}
                          </h3>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-semibold text-[#72766B]">
                              Attendance: <strong className="text-[#426B52]">{classItem.percentage}%</strong>
                            </span>

                            <button
                              onClick={() => {
                                setSelectedSubjectFilter(classItem.subjectName);
                                setTab('MATERIALS');
                              }}
                              className="px-4 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] text-xs font-extrabold text-[#252820] rounded-xl hover:bg-[#F6F4EF] hover:border-[#426B52] transition-colors shadow-2xs cursor-pointer"
                            >
                              Materials
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#FFFEFC] border border-[#E5E1D8] border-dashed rounded-[24px] p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E9F0E5] text-[#426B52] flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base text-[#252820]">No Scheduled Classes Today</h3>
                    <p className="text-xs text-[#72766B] max-w-sm mt-1">
                      You are all caught up on class sessions. Review your learning roadmap or explore study materials below.
                    </p>
                  </div>
                  <button
                    onClick={() => setTab('ROADMAP')}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    View Learning Roadmap
                  </button>
                </div>
              )}
            </div>

            {/* 4. IN PROGRESS LEARNING CONTENT (Reference Screenshot) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-serif font-black text-[#252820]">
                  In progress learning content
                </h2>
                <button
                  onClick={() => setTab('MATERIALS')}
                  className="text-xs font-bold text-[#72766B] hover:text-[#426B52] transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              {(() => {
                const filteredMaterials = (materials || []).filter((m: any) => {
                  if (selectedSubjectFilter === 'All Subjects') return true;
                  return m.subject?.name === selectedSubjectFilter;
                });

                if (filteredMaterials.length === 0) {
                  return (
                    <div className="bg-[#FFFEFC] border border-[#E5E1D8] border-dashed rounded-[22px] p-8 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F6F4EF] text-[#426B52] flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-base text-[#252820]">No In-Progress Materials</h3>
                        <p className="text-xs text-[#72766B] max-w-sm mt-1">
                          {selectedSubjectFilter === 'All Subjects'
                            ? 'No learning materials are currently in progress. Access the Materials tab to view published course notes.'
                            : `No materials found under ${selectedSubjectFilter}.`}
                        </p>
                      </div>
                      <button
                        onClick={() => setTab('MATERIALS')}
                        className="px-4 py-2 bg-[#FFFEFC] border border-[#E5E1D8] hover:border-[#426B52] text-[#252820] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        Browse Materials Library
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {filteredMaterials.slice(0, 5).map((item: any, idx: number) => {
                      const tag = item.subject?.name || item.classSection?.course?.name || 'General';
                      const styles = [
                        { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]' },
                        { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
                        { bg: 'bg-[#FFE4E6]', text: 'text-[#BE123C]' },
                        { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' }
                      ];
                      const style = styles[idx % styles.length];
                      const fileCount = item.attachments?.length || 1;

                      return (
                        <div
                          key={item.id}
                          className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-[22px] p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs transition-shadow"
                        >
                          {/* Left Icon + Title */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                              {tag.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-[10px] font-bold text-[#72766B] border border-[#E5E1D8] bg-[#F6F4EF] px-2 py-0.5 rounded-full inline-block">
                                {tag}
                              </span>
                              <h4 className="font-extrabold text-sm text-[#252820] truncate">
                                {item.title}
                              </h4>
                            </div>
                          </div>

                          {/* Middle Progress Stats */}
                          <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-center shrink-0">
                            <div>
                              <span className="text-[10px] font-bold text-[#72766B] uppercase block">Content</span>
                              <span className="text-xs font-black text-[#252820]">{fileCount} {fileCount === 1 ? 'Material' : 'Materials'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-[#72766B] uppercase block">Status</span>
                                <span className="text-xs font-black text-[#252820]">Active</span>
                              </div>
                              <svg className="w-5 h-5 text-[#426B52]" viewBox="0 0 36 36">
                                <path
                                  className="text-[#E5E1D8]"
                                  strokeWidth="3.5"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-[#426B52]"
                                  strokeDasharray="60, 100"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-[#72766B] uppercase block">Date</span>
                              <div className="flex items-center gap-1 text-xs font-black text-[#252820]">
                                <Clock className="w-3 h-3 text-[#72766B]" />
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (item.fileUrl) {
                                  window.open(item.fileUrl, '_blank');
                                } else {
                                  setTab('MATERIALS');
                                }
                              }}
                              className="px-4 py-1.5 bg-[#FFFEFC] border border-[#E5E1D8] text-xs font-extrabold text-[#252820] rounded-xl hover:bg-[#F6F4EF] hover:border-[#426B52] transition-colors shadow-2xs cursor-pointer ml-1"
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* COORDINATED FEATURE 3: Compact Learning Tracker Overview Widget */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#426B52]" />
                    <h3 className="text-base font-black text-[#252820]">Weekly Learning Tracker</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F6F4EF] text-[#72766B] border border-[#E5E1D8] px-2 py-0.5 rounded-full">
                      {trackerData?.timeRange?.cycleLabel || 'Weekly Cycle'}
                    </span>
                  </div>
                  <p className="text-xs text-[#72766B] mt-0.5">
                    Real-time metrics verified against your enrolled coursework and active roadmap.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogHoursModalOpen(true)}
                    className="px-3 py-1.5 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Study Time
                  </button>
                  <button
                    onClick={() => setTab('PROGRESS')}
                    className="text-xs font-bold text-[#426B52] hover:underline px-2 py-1"
                  >
                    Open Tracker &rarr;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Study Hours */}
                <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase">
                    <span>Study Target</span>
                    <span className="text-[#426B52]">{trackerData?.studyHours?.percentage ?? 100}%</span>
                  </div>
                  <div className="text-lg font-black text-[#252820] mt-1">
                    {trackerData?.studyHours?.logged ?? 14} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.studyHours?.target ?? 12} hrs</span>
                  </div>
                  <div className="w-full bg-[#E5E1D8] h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.studyHours?.percentage ?? 100} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-[#426B52] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.studyHours?.percentage ?? 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#72766B] mt-1.5 block">
                    {trackerData?.studyHours?.isEmpty ? 'No hours logged this week yet' : 'Target commitment tracked'}
                  </span>
                </div>

                {/* 2. Milestones */}
                <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase">
                    <span>Roadmap</span>
                    <span className="text-[#C77952]">{trackerData?.milestones?.percentage ?? 25}%</span>
                  </div>
                  <div className="text-lg font-black text-[#252820] mt-1">
                    {trackerData?.milestones?.completed ?? 2} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.milestones?.total ?? 8} done</span>
                  </div>
                  <div className="w-full bg-[#E5E1D8] h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.milestones?.percentage ?? 25} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-[#C77952] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.milestones?.percentage ?? 25)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#72766B] mt-1.5 block">
                    {trackerData?.milestones?.pending ?? 6} milestones remaining
                  </span>
                </div>

                {/* 3. Coursework */}
                <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase">
                    <span>Coursework</span>
                    <span className="text-[#426B52]">{trackerData?.coursework?.submissionRate ?? 100}%</span>
                  </div>
                  <div className="text-lg font-black text-[#252820] mt-1">
                    {trackerData?.coursework?.submitted ?? 7} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.coursework?.total ?? 7} submitted</span>
                  </div>
                  <div className="w-full bg-[#E5E1D8] h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.coursework?.submissionRate ?? 100} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-[#A8B99A] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.coursework?.submissionRate ?? 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#72766B] mt-1.5 block">
                    {trackerData?.coursework?.pending ? `${trackerData.coursework.pending} due soon` : 'All tasks up to date'}
                  </span>
                </div>

                {/* 4. Attendance */}
                <div className="p-3.5 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase">
                    <span>Attendance</span>
                    <span className="text-[#426B52]">{trackerData?.attendance?.percentage ?? 100}%</span>
                  </div>
                  <div className="text-lg font-black text-[#252820] mt-1">
                    {trackerData?.attendance?.attended ?? 0} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.attendance?.conducted ?? 0} classes</span>
                  </div>
                  <div className="w-full bg-[#E5E1D8] h-1.5 rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.attendance?.percentage ?? 100} aria-valuemin={0} aria-valuemax={100}>
                    <div className="bg-[#426B52] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.attendance?.percentage ?? 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-[#72766B] mt-1.5 block">
                    {(trackerData?.attendance?.percentage ?? 100) >= 75 ? 'Good standing' : 'Below 75% threshold'}
                  </span>
                </div>
              </div>
            </div>

            {/* COORDINATED FEATURE 2: AI Mentor Highlights Card */}
            {mentorRecs.length > 0 && (
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C77952]" />
                    <h3 className="text-base font-black text-[#252820]">AI Mentor Guidance</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C77952]/10 text-[#C77952] border border-[#C77952]/30 px-2 py-0.5 rounded-full">
                      AI Generated
                    </span>
                  </div>
                  <button onClick={() => setTab('AI_MENTOR')} className="text-xs font-bold text-[#426B52] hover:underline">
                    View All Guidance ({mentorRecs.filter(r => !dismissedRecIds.includes(r.id)).length}) &rarr;
                  </button>
                </div>

                {(() => {
                  const activeRec = mentorRecs.find(r => !dismissedRecIds.includes(r.id)) || mentorRecs[0];
                  if (!activeRec) return null;
                  const isAccepted = acceptedRecIds.includes(activeRec.id);
                  return (
                    <div className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#426B52] text-white">
                            {activeRec.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-extrabold text-[#252820]">{activeRec.title}</span>
                          <span className="text-[10px] text-[#72766B] font-semibold">&bull; {activeRec.timeframe}</span>
                        </div>
                        <p className="text-xs text-[#252820]/80 leading-relaxed max-w-2xl">
                          {activeRec.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAcceptRec(activeRec.id)}
                          disabled={isAccepted}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                            isAccepted ? 'bg-[#A8B99A]/30 text-[#426B52] border border-[#A8B99A]' : 'bg-[#426B52] hover:bg-[#365843] text-white'
                          }`}
                        >
                          {isAccepted ? 'Added to Plan ✓' : activeRec.suggestedAction || 'Add to Plan'}
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(activeRec)}
                          className="px-3 py-1.5 border border-[#E5E1D8] hover:bg-[#FFFEFC] text-xs font-bold text-[#252820] rounded-xl transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => handleDismissRec(activeRec.id)}
                          className="px-2 py-1.5 text-xs text-[#72766B] hover:text-[#C77952] transition-colors"
                          title="Dismiss recommendation"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* COORDINATED FEATURE 1: Chat Agent Suggested Questions Banner */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#426B52]" />
                  <h4 className="font-extrabold text-sm text-[#252820]">Ask Course & Study Assistant</h4>
                </div>
                <span className="text-[10px] font-semibold text-[#72766B]">
                  Verifies against your {materials.length} uploaded course materials
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'What study materials do I have for my upcoming classes?',
                  'What assignments are due soon and how should I prepare?',
                  'How do my enrolled subjects align with my target career goal?'
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatOpen(true);
                      handleSendChatMessage(prompt);
                    }}
                    className="text-left px-3 py-2 bg-[#F6F4EF] hover:bg-[#E5E1D8]/50 border border-[#E5E1D8] rounded-xl text-xs text-[#252820] font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-[#426B52] font-black">?</span>
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Roadmap & Learning Progress Banner */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/40 px-2 py-0.5 rounded">
                    Active Learning Roadmap
                  </span>
                  <h3 className="text-lg font-black text-[#252820] mt-1.5">
                    {skillPathData?.currentRoadmap?.title || 'Full Stack Developer Accelerated Roadmap'}
                  </h3>
                  <p className="text-xs text-[#72766B] mt-0.5">
                    {skillPathData?.currentRoadmap?.description || 'Personalized trajectory targeting system design and production deployments.'}
                  </p>
                </div>
                <button onClick={() => setTab('ROADMAP')} className="text-xs font-bold text-[#426B52] hover:underline">
                  View Roadmap Phases &rarr;
                </button>
              </div>

              {/* Phase timeline cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {(skillPathData?.currentRoadmap?.phases || []).map((ph: any, i: number) => (
                  <div key={i} className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black uppercase text-[#72766B]">Phase {ph.phase || i + 1}</span>
                      <span className="text-[10px] font-bold text-[#426B52]">{ph.duration || '4 Weeks'}</span>
                    </div>
                    <h4 className="font-extrabold text-[#252820] text-xs mb-1.5">{ph.name}</h4>
                    <div className="flex flex-wrap gap-1">
                      {(ph.skills || []).map((s: string, idx: number) => (
                        <span key={idx} className="text-[9px] bg-[#FFFEFC] border border-[#E5E1D8] text-[#252820] px-1.5 py-0.5 rounded font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Evaluation Highlights */}
            {skillPathData?.latestScoringReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#252820] text-sm mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#426B52]" />
                    Key Identified Strengths
                  </h3>
                  <ul className="space-y-2 text-xs text-[#252820]/80">
                    {skillPathData.latestScoringReport.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#426B52] mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#252820] text-sm mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#C77952]" />
                    Next Milestones & Action Plan
                  </h3>
                  <ul className="space-y-2 text-xs text-[#252820]/80">
                    {skillPathData.latestScoringReport.improvementPlan.map((plan: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C77952] mt-1.5 shrink-0" />
                        <span>{plan}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COORDINATED FEATURE 2: TAB AI MENTOR */}
        {tab === 'AI_MENTOR' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#252820] flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#C77952]" /> Ask. Learn. Keep Moving Forward.
                </h1>
                <p className="text-xs text-[#72766B] mt-1">
                  Get personalized learning guidance based on your profile and current career goals.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMentorData}
                  disabled={mentorLoading}
                  className="px-3.5 py-2 bg-[#FFFEFC] border border-[#E5E1D8] hover:bg-[#E5E1D8]/40 text-[#252820] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#426B52] ${mentorLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Guidance</span>
                </button>
              </div>
            </div>

            {/* AI Attribution Disclaimer */}
            <div className="p-4 bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-[#426B52] shrink-0 mt-0.5" />
              <div className="text-xs text-[#252820]/90 leading-relaxed">
                <strong className="font-bold text-[#252820]">AI-Generated Guidance</strong>: Recommendations are synthesized by GoWithFlow based on your enrolled coursework, roadmap milestones, and self-reported target hours. This advice is designed to assist independent study planning and does not represent official faculty evaluations.
              </div>
            </div>

            {/* Category Filter Pills & Dismissed Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ALL', label: 'All Guidance' },
                  { id: 'GOAL', label: 'Goal Setting' },
                  { id: 'STUDY_PLAN', label: 'Study Sessions' },
                  { id: 'REFLECTION', label: 'Progress Reflection' },
                  { id: 'NEXT_STEP', label: 'Next Steps' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setMentorFilterCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      mentorFilterCategory === cat.id
                        ? 'bg-[#426B52] text-white shadow-sm'
                        : 'bg-[#FFFEFC] border border-[#E5E1D8] text-[#72766B] hover:text-[#252820] hover:bg-[#F6F4EF]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {dismissedRecIds.length > 0 && (
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="text-xs font-semibold text-[#72766B] hover:text-[#252820] flex items-center gap-1"
                >
                  <span>{showDismissed ? 'Hide dismissed' : `Show dismissed (${dismissedRecIds.length})`}</span>
                </button>
              )}
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
              {mentorRecs
                .filter(rec => {
                  if (mentorFilterCategory !== 'ALL' && rec.category !== mentorFilterCategory) return false;
                  if (!showDismissed && dismissedRecIds.includes(rec.id)) return false;
                  return true;
                })
                .map(rec => {
                  const isDismissed = dismissedRecIds.includes(rec.id);
                  const isAccepted = acceptedRecIds.includes(rec.id);

                  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                    GOAL: { bg: 'bg-[#C77952]/10', text: 'text-[#C77952]', border: 'border-[#C77952]/30' },
                    STUDY_PLAN: { bg: 'bg-[#426B52]/10', text: 'text-[#426B52]', border: 'border-[#426B52]/30' },
                    REFLECTION: { bg: 'bg-[#A8B99A]/20', text: 'text-[#426B52]', border: 'border-[#A8B99A]/40' },
                    NEXT_STEP: { bg: 'bg-[#252820]/10', text: 'text-[#252820]', border: 'border-[#252820]/20' }
                  };
                  const color = categoryColors[rec.category] || categoryColors.GOAL;

                  return (
                    <div
                      key={rec.id}
                      className={`bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm transition-all ${
                        isDismissed ? 'opacity-60 bg-[#F6F4EF]' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${color.bg} ${color.text} ${color.border}`}>
                              {rec.category.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-bold text-[#72766B] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rec.timeframe}
                            </span>
                            <span className="text-[10px] text-[#A8B99A] font-semibold bg-[#252820] px-2 py-0.5 rounded text-white">
                              AI Advice
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-[#252820]">
                            {rec.title}
                          </h3>

                          <p className="text-xs text-[#252820]/85 leading-relaxed">
                            {rec.description}
                          </p>

                          <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#72766B]">
                            <span>Focus: <strong className="text-[#252820]">{rec.impactTopic}</strong></span>
                            <span>&bull;</span>
                            <span>{rec.confidenceNote}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                          {isDismissed ? (
                            <button
                              onClick={() => handleRestoreRec(rec.id)}
                              className="px-3 py-1.5 text-xs font-bold text-[#426B52] border border-[#426B52] hover:bg-[#426B52]/10 rounded-xl transition-colors"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAcceptRec(rec.id)}
                                disabled={isAccepted}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
                                  isAccepted
                                    ? 'bg-[#A8B99A]/30 text-[#426B52] border border-[#A8B99A]'
                                    : 'bg-[#426B52] hover:bg-[#365843] text-white shadow-sm'
                                }`}
                              >
                                {isAccepted ? 'Added to Study Plan ✓' : rec.suggestedAction || 'Accept into Plan'}
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(rec)}
                                className="px-3 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-xs font-bold text-[#252820] rounded-xl transition-colors"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => handleDismissRec(rec.id)}
                                className="px-2.5 py-2 border border-[#E5E1D8] hover:bg-[#C77952]/10 text-xs font-bold text-[#72766B] hover:text-[#C77952] rounded-xl transition-colors"
                                title="Dismiss this guidance"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {mentorRecs.filter(r => !dismissedRecIds.includes(r.id)).length === 0 && (
                <div className="p-10 bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#426B52] mx-auto" />
                  <h4 className="font-extrabold text-[#252820] text-sm">All Current Recommendations Addressed</h4>
                  <p className="text-xs text-[#72766B] max-w-md mx-auto">
                    You have reviewed and acted on all recommendations in this cycle. Log more study hours or complete course assignments to generate new guidance.
                  </p>
                  <button
                    onClick={fetchMentorData}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Re-Analyze Progress
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY PROFILE */}
        {tab === 'PROFILE' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#252820]">Your Professional Identity.</h2>
              <p className="text-xs text-[#72766B] mt-1">Manage the information that helps GoWithFlow understand your background, capabilities and experience.</p>
            </div>
            
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={obPersonal.fullName}
                    onChange={(e) => setObPersonal({ ...obPersonal, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Institution</label>
                  <input
                    type="text"
                    value={obPersonal.college}
                    onChange={(e) => setObPersonal({ ...obPersonal, college: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Department</label>
                  <input
                    type="text"
                    value={obPersonal.department}
                    onChange={(e) => setObPersonal({ ...obPersonal, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Education Level & Year</label>
                  <input
                    type="text"
                    value={`${obPersonal.educationLevel} (Graduating ${obPersonal.graduationYear})`}
                    disabled
                    className="w-full px-4 py-2.5 bg-[#F6F4EF]/60 border border-[#E5E1D8] rounded-xl text-sm text-[#72766B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={obPersonal.linkedinUrl}
                    onChange={(e) => setObPersonal({ ...obPersonal, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">GitHub Profile</label>
                  <input
                    type="url"
                    value={obPersonal.githubUrl}
                    onChange={(e) => setObPersonal({ ...obPersonal, githubUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Portfolio Link</label>
                  <input
                    type="url"
                    value={obPersonal.portfolioUrl}
                    onChange={(e) => setObPersonal({ ...obPersonal, portfolioUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/student/onboard', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: obPersonal.fullName })
                    });
                    loadAllDashboardData();
                    alert('Profile updated successfully!');
                  }}
                  className="px-6 py-2.5 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY SKILLS */}
        {tab === 'SKILLS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252820]">Understand Your Current Capabilities.</h2>
                <p className="text-xs text-[#72766B] mt-1">Manage your technical and professional skills, update proficiency and review assessment evidence.</p>
              </div>
              <button
                onClick={() => setShowAddSkillModal(true)}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>

            {/* Quick Add Modal */}
            {showAddSkillModal && (
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-[#252820] uppercase tracking-wider">Register New Skill</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Skill Name (e.g. Docker)"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                  <select
                    value={newSkillProf}
                    onChange={(e) => setNewSkillProf(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  >
                    <option>Beginner</option>
                    <option>Basic</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                  <select
                    value={newSkillSource}
                    onChange={(e) => setNewSkillSource(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  >
                    <option>Self-learning</option>
                    <option>College coursework</option>
                    <option>Certification</option>
                    <option>Personal project</option>
                    <option>Internship</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!newSkillInput.trim()) return;
                      await skillsService.addSkill({ skillName: newSkillInput.trim(), proficiency: newSkillProf, source: newSkillSource });
                      setNewSkillInput('');
                      setShowAddSkillModal(false);
                      loadAllDashboardData();
                    }}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Confirm & Save
                  </button>
                  <button onClick={() => setShowAddSkillModal(false)} className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-[#252820] text-xs font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(skillPathData?.skills || []).length === 0 ? (
                <div className="col-span-full p-8 text-center bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#252820]">Your Skills Journey Starts Here.</h4>
                  <p className="text-xs text-[#72766B] max-w-sm mx-auto">Add your existing skills so we can understand your current capabilities.</p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAddSkillModal(true)}
                      className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Your First Skill
                    </button>
                  </div>
                </div>
              ) : (
                skillPathData.skills.map((sk: any) => (
                <div key={sk.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#252820] text-sm">{sk.skillName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/40 font-bold px-2 py-0.5 rounded">
                        {sk.proficiency}
                      </span>
                      <span className="text-[10px] text-[#72766B]">via {sk.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-[#252820] bg-[#F6F4EF] px-2 py-1 rounded border border-[#E5E1D8]">
                      Score: {sk.assessmentScore || 75}/100
                    </span>
                    <button
                      onClick={async () => {
                        await skillsService.deleteSkill(sk.id);
                        loadAllDashboardData();
                      }}
                      className="text-[#72766B] hover:text-[#C77952]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}

        {/* TAB 4: MY CERTIFICATIONS */}
        {tab === 'CERTIFICATIONS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252820]">Every Achievement Adds to Your Story.</h2>
                <p className="text-xs text-[#72766B] mt-1">Manage your certifications and credentials in one place.</p>
              </div>
              <button
                onClick={() => setShowAddCertModal(true)}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Certification
              </button>
            </div>

            {/* Quick Add Modal */}
            {showAddCertModal && (
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-[#252820] uppercase tracking-wider">Log Certification</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Certification Name"
                    value={newCertName}
                    onChange={(e) => setNewCertName(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                  <input
                    type="text"
                    placeholder="Issuing Organization"
                    value={newCertOrg}
                    onChange={(e) => setNewCertOrg(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <input
                  type="url"
                  placeholder="Verification Link / Document URL"
                  value={newCertUrl}
                  onChange={(e) => setNewCertUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!newCertName.trim()) return;
                      await certificationsService.addCertification({ name: newCertName.trim(), issuingOrg: newCertOrg.trim(), credentialUrl: newCertUrl.trim() });
                      setNewCertName('');
                      setNewCertOrg('');
                      setNewCertUrl('');
                      setShowAddCertModal(false);
                      loadAllDashboardData();
                    }}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Confirm & Save
                  </button>
                  <button onClick={() => setShowAddCertModal(false)} className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-[#252820] text-xs font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(skillPathData?.certifications || []).length === 0 ? (
                <div className="col-span-full p-8 text-center bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#252820]">No Certifications Yet? That&apos;s Okay.</h4>
                  <p className="text-xs text-[#72766B] max-w-sm mx-auto">You can add certifications whenever you earn them.</p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAddCertModal(true)}
                      className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Certification
                    </button>
                  </div>
                </div>
              ) : (
                skillPathData.certifications.map((c: any) => (
                  <div key={c.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/40 font-bold px-2 py-0.5 rounded">
                          {c.verificationStatus} ✓
                        </span>
                        <span className="text-[10px] text-[#72766B] font-semibold">{c.issueDate || '2026'}</span>
                      </div>
                      <h4 className="font-bold text-[#252820] text-sm">{c.name}</h4>
                      <p className="text-xs text-[#72766B] mt-0.5">{c.issuingOrg}</p>
                      {c.credentialUrl && (
                        <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-[#426B52] font-bold hover:underline inline-flex items-center gap-1 mt-2">
                          View Verification <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        await certificationsService.deleteCertification(c.id);
                        loadAllDashboardData();
                      }}
                      className="text-[#72766B] hover:text-[#C77952]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: MY PROJECTS */}
        {tab === 'PROJECTS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252820]">Turn Your Knowledge Into Demonstrable Work.</h2>
                <p className="text-xs text-[#72766B] mt-1">Showcase the applications and projects that represent your practical abilities.</p>
              </div>
              <button
                onClick={() => setShowAddProjModal(true)}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>

            {/* Quick Add Modal */}
            {showAddProjModal && (
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-5 rounded-2xl shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-[#252820] uppercase tracking-wider">Showcase Built Project</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                  <input
                    type="text"
                    placeholder="Technologies (e.g. React, Node, PostgreSQL)"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    className="px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Short description of features & achievements"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
                <input
                  type="url"
                  placeholder="GitHub Repository URL"
                  value={newProjGit}
                  onChange={(e) => setNewProjGit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!newProjName.trim()) return;
                      await projectsService.addProject({
                        name: newProjName.trim(),
                        description: newProjDesc.trim(),
                        technologies: newProjTech.trim(),
                        githubUrl: newProjGit.trim()
                      });
                      setNewProjName('');
                      setNewProjDesc('');
                      setNewProjTech('');
                      setNewProjGit('');
                      setShowAddProjModal(false);
                      loadAllDashboardData();
                    }}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                  >
                    Confirm & Publish
                  </button>
                  <button onClick={() => setShowAddProjModal(false)} className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-[#252820] text-xs font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(skillPathData?.projects || []).length === 0 ? (
                <div className="col-span-full p-8 text-center bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#252820]">Every Great Career Starts With Building Something.</h4>
                  <p className="text-xs text-[#72766B] max-w-sm mx-auto">Add your projects to demonstrate what you can create and what you have learned.</p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAddProjModal(true)}
                      className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Project
                    </button>
                  </div>
                </div>
              ) : (
                skillPathData.projects.map((p: any) => (
                  <div key={p.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/40 px-2 py-0.5 rounded">
                          {p.category || 'Full Stack'}
                        </span>
                        <button
                          onClick={async () => {
                            await projectsService.deleteProject(p.id);
                            loadAllDashboardData();
                          }}
                          className="text-[#72766B] hover:text-[#C77952]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-[#252820] text-sm">{p.name}</h4>
                      <p className="text-xs text-[#72766B] mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(Array.isArray(p.technologies) ? p.technologies : [p.technologies]).map((tech: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-[#F6F4EF] border border-[#E5E1D8] text-[#252820] px-2 py-0.5 rounded font-bold">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#E5E1D8] pt-3 mt-4 flex items-center justify-between text-xs">
                      {p.githubUrl ? (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[#426B52] font-bold hover:underline inline-flex items-center gap-1">
                          GitHub Repo <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : <span />}
                      <span className="text-[10px] text-[#72766B] font-bold">Verified Code Node</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: CAREER GOALS */}
        {tab === 'CAREER_GOALS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#252820]">Define Where You Want to Go.</h2>
              <p className="text-xs text-[#72766B] mt-1">Set your target role, preferred industry and career timeline.</p>
            </div>
            
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Primary Target Role</label>
                  <select
                    value={obCareer.primaryRole}
                    onChange={(e) => setObCareer({ ...obCareer, primaryRole: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  >
                    <option>Full Stack Developer</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>AI/ML Engineer</option>
                    <option>Data Scientist</option>
                    <option>Cloud Engineer</option>
                    <option>DevOps Engineer</option>
                    <option>Cybersecurity Analyst</option>
                    <option>Mobile App Developer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#72766B] mb-1">Target Timeline</label>
                  <select
                    value={obCareer.targetDate}
                    onChange={(e) => setObCareer({ ...obCareer, targetDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                  >
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                    <option>Post Graduation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#72766B] mb-1">Target Industry / Segment</label>
                <input
                  type="text"
                  value={obCareer.targetIndustry}
                  onChange={(e) => setObCareer({ ...obCareer, targetIndustry: e.target.value })}
                  className="w-full px-4 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await careerService.updateCareerGoal(obCareer);
                    await loadAllDashboardData();
                    alert('Career goal updated and new roadmap compiled!');
                  }}
                  className="px-6 py-2.5 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                >
                  Save Goal & Re-Compile Learning Roadmap
                </button>
              </div>
            </div>

            {/* Historical Career Goals Log */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#72766B]">Career Goal Progression History</h3>
              {(skillPathData?.careerGoals || []).map((cg: any, i: number) => (
                <div key={cg.id || i} className="p-4 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-[#252820] text-xs">{cg.primaryRole}</span>
                    <span className="text-[10px] text-[#72766B] block">{cg.targetIndustry} &bull; Timeline: {cg.targetDate}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cg.isCurrent ? 'bg-[#A8B99A]/20 text-[#426B52] border-[#A8B99A]/40' : 'bg-[#F6F4EF] text-[#72766B] border-[#E5E1D8]'}`}>
                    {cg.isCurrent ? 'Current Goal ✓' : 'Archived'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: LEARNING ROADMAP */}
        {tab === 'ROADMAP' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252820]">Your Personalized Path to Progress.</h2>
                <p className="text-xs text-[#72766B] mt-1">
                  Explore learning phases, recommended resources, milestones and your next steps &bull; Active Track: <strong className="text-[#252820]">{skillPathData?.currentRoadmap?.targetRole || 'Full Stack Developer'}</strong>
                </p>
              </div>
              <button
                onClick={handleRunSuggestionAgent}
                disabled={runningAgent === 'WF-01'}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Regenerate with AI
              </button>
            </div>

            <div className="space-y-4">
              {(skillPathData?.currentRoadmap?.phases || []).length === 0 ? (
                <div className="p-8 text-center bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-sm text-[#252820]">Your Personalized Roadmap Is Waiting.</h4>
                  <p className="text-xs text-[#72766B] max-w-sm mx-auto">Complete your learner profile and career goals to generate your learning roadmap.</p>
                  <div className="pt-2">
                    <button
                      onClick={handleRunSuggestionAgent}
                      disabled={runningAgent === 'WF-01'}
                      className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate My Roadmap
                    </button>
                  </div>
                </div>
              ) : (
                (skillPathData?.currentRoadmap?.phases || []).map((ph: any, idx: number) => (
                <div key={idx} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#426B52] bg-[#A8B99A]/20 border border-[#A8B99A]/40 px-2 py-0.5 rounded">
                        Phase {ph.phase || idx + 1}
                      </span>
                      <h3 className="font-extrabold text-[#252820] text-base mt-1">{ph.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-[#72766B] bg-[#F6F4EF] px-2.5 py-1 rounded-lg border border-[#E5E1D8]">
                      Duration: {ph.duration || '4 Weeks'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <span className="text-[11px] font-bold text-[#72766B] uppercase tracking-wider block">Target Competencies</span>
                    <div className="flex flex-wrap gap-2">
                      {(ph.skills || []).map((sk: string, sIdx: number) => (
                        <span key={sIdx} className="px-3 py-1 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#252820]">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )))}
            </div>

            {/* Recommended Learning Resources */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-[#252820] text-base">Curated Study Resources & Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(skillPathData?.resources || []).map((res: any, i: number) => (
                  <div key={res.id || i} className="p-4 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase bg-[#FFFEFC] px-2 py-0.5 rounded border border-[#E5E1D8] text-[#72766B]">
                        {res.type}
                      </span>
                      <h4 className="font-bold text-[#252820] text-xs mt-2">{res.title}</h4>
                      <p className="text-[10px] text-[#72766B] mt-1">{res.provider} &bull; {res.estimatedHours} hrs</p>
                    </div>
                    <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-[#426B52] font-bold hover:underline inline-flex items-center gap-1 mt-3">
                      Start Learning <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COORDINATED FEATURE 3: TAB LEARNING TRACKER */}
        {tab === 'PROGRESS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#252820] flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#426B52]" /> See How Far You&apos;ve Come.
                </h1>
                <p className="text-xs text-[#72766B] mt-1">
                  Track completed resources, assessments, milestones and learning progress.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFFEFC] text-[#72766B] border border-[#E5E1D8] px-3 py-1.5 rounded-xl">
                  {trackerData?.timeRange?.semester || 'Fall Semester 2026'} &bull; {trackerData?.timeRange?.cycleLabel || 'Weekly Cycle (Mon – Sun)'}
                </span>
                <button
                  onClick={() => setLogHoursModalOpen(true)}
                  className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Log Study Session
                </button>
              </div>
            </div>

            {/* Top Verified Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Study Commitment */}
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase tracking-wider">
                  <span>Weekly Study Goal</span>
                  <span className="text-[#426B52]">{trackerData?.studyHours?.percentage ?? 100}%</span>
                </div>
                <div className="text-2xl font-black text-[#252820] mt-1.5">
                  {trackerData?.studyHours?.logged ?? 14} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.studyHours?.target ?? 12} hrs</span>
                </div>
                <div className="w-full bg-[#E5E1D8] h-2 rounded-full mt-2.5 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.studyHours?.percentage ?? 100} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-[#426B52] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.studyHours?.percentage ?? 100)}%` }} />
                </div>
                <span className="text-[11px] text-[#252820]/80 font-medium mt-2 block">
                  {trackerData?.studyHours?.percentage ?? 100}% of weekly commitment logged ({Math.max(0, (trackerData?.studyHours?.target ?? 12) - (trackerData?.studyHours?.logged ?? 14))} hrs remaining)
                </span>
              </div>

              {/* Card 2: Roadmap Milestones */}
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase tracking-wider">
                  <span>Milestones Completed</span>
                  <span className="text-[#C77952]">{trackerData?.milestones?.percentage ?? 25}%</span>
                </div>
                <div className="text-2xl font-black text-[#252820] mt-1.5">
                  {trackerData?.milestones?.completed ?? 2} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.milestones?.total ?? 8}</span>
                </div>
                <div className="w-full bg-[#E5E1D8] h-2 rounded-full mt-2.5 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.milestones?.percentage ?? 25} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-[#C77952] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.milestones?.percentage ?? 25)}%` }} />
                </div>
                <span className="text-[11px] text-[#252820]/80 font-medium mt-2 block">
                  {trackerData?.milestones?.pending ?? 6} milestones pending in active career roadmap
                </span>
              </div>

              {/* Card 3: Coursework Submissions */}
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase tracking-wider">
                  <span>Course Submissions</span>
                  <span className="text-[#426B52]">{trackerData?.coursework?.submissionRate ?? 100}%</span>
                </div>
                <div className="text-2xl font-black text-[#252820] mt-1.5">
                  {trackerData?.coursework?.submitted ?? 7} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.coursework?.total ?? 7}</span>
                </div>
                <div className="w-full bg-[#E5E1D8] h-2 rounded-full mt-2.5 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.coursework?.submissionRate ?? 100} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-[#A8B99A] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.coursework?.submissionRate ?? 100)}%` }} />
                </div>
                <span className="text-[11px] text-[#252820]/80 font-medium mt-2 block">
                  {trackerData?.coursework?.submissionRate ?? 100}% submission rate ({trackerData?.coursework?.pending ?? 0} pending)
                </span>
              </div>

              {/* Card 4: Classroom Attendance */}
              <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#72766B] uppercase tracking-wider">
                  <span>Class Attendance</span>
                  <span className="text-[#426B52]">{trackerData?.attendance?.percentage ?? 100}%</span>
                </div>
                <div className="text-2xl font-black text-[#252820] mt-1.5">
                  {trackerData?.attendance?.attended ?? 0} <span className="text-xs font-bold text-[#72766B]">/ {trackerData?.attendance?.conducted ?? 0} sessions</span>
                </div>
                <div className="w-full bg-[#E5E1D8] h-2 rounded-full mt-2.5 overflow-hidden" role="progressbar" aria-valuenow={trackerData?.attendance?.percentage ?? 100} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-[#426B52] h-full rounded-full transition-all" style={{ width: `${Math.min(100, trackerData?.attendance?.percentage ?? 100)}%` }} />
                </div>
                <span className="text-[11px] text-[#252820]/80 font-medium mt-2 block">
                  {(trackerData?.attendance?.percentage ?? 100) >= 75 ? 'Academic status: In good standing' : 'Academic status: Below required attendance'}
                </span>
              </div>
            </div>

            {/* Section 1: Interactive Roadmap Milestones Tracker */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#252820]">Roadmap Milestones Progress</h3>
                  <p className="text-xs text-[#72766B] mt-0.5">
                    Step-by-step milestones toward your target role of <strong className="text-[#252820]">{skillPathData?.currentCareerGoal?.primaryRole || 'Software Engineer'}</strong>.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#426B52]">
                  {trackerData?.milestones?.completed ?? 2} of {trackerData?.milestones?.total ?? 8} milestones completed ({trackerData?.milestones?.percentage ?? 25}%)
                </span>
              </div>

              {trackerData?.milestones?.phases?.length > 0 ? (
                <div className="space-y-3">
                  {trackerData.milestones.phases.map((ph: any, idx: number) => {
                    const isDone = ph.status === 'COMPLETED';
                    const isCurrent = ph.status === 'IN_PROGRESS';
                    const phaseNum = ph.phaseNumber || idx + 1;
                    return (
                      <div
                        key={phaseNum}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-[#A8B99A]/10 border-[#A8B99A]/40'
                            : isCurrent
                            ? 'bg-[#C77952]/5 border-[#C77952]/40'
                            : 'bg-[#F6F4EF] border-[#E5E1D8]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-[#72766B]">
                              Milestone {phaseNum}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isDone
                                  ? 'bg-[#426B52] text-white'
                                  : isCurrent
                                  ? 'bg-[#C77952] text-white'
                                  : 'bg-[#E5E1D8] text-[#72766B]'
                              }`}
                            >
                              {ph.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-[#252820] text-sm">
                            {ph.title}
                          </h4>
                          {ph.desc && (
                            <p className="text-xs text-[#252820]/75">
                              {ph.desc}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleTogglePhase(phaseNum, ph.status)}
                            disabled={toggleMilestoneLoading === phaseNum}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                              isDone
                                ? 'border border-[#426B52] text-[#426B52] hover:bg-[#426B52]/10'
                                : 'bg-[#426B52] hover:bg-[#365843] text-white shadow-sm'
                            }`}
                          >
                            {toggleMilestoneLoading === phaseNum
                              ? 'Updating...'
                              : isDone
                              ? 'Mark In Progress'
                              : 'Mark Completed ✓'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#72766B] bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  No active roadmap milestones recorded yet. Run the Suggestion Agent on the Overview Desk to compile your roadmap.
                </div>
              )}
            </div>

            {/* Section 2: Coursework Submissions Ledger */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#252820]">Coursework Submissions Ledger</h3>
                  <p className="text-xs text-[#72766B] mt-0.5">
                    Verified record of homework assignments, deadlines, and faculty evaluation scores.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#72766B]">
                  {trackerData?.coursework?.submitted ?? 7} of {trackerData?.coursework?.total ?? 7} submitted
                </span>
              </div>

              {trackerData?.coursework?.assignmentsList?.length > 0 ? (
                <div className="divide-y divide-[#E5E1D8] border border-[#E5E1D8] rounded-xl overflow-hidden">
                  {trackerData.coursework.assignmentsList.map((as: any) => (
                    <div key={as.id} className="p-4 bg-[#FFFEFC] hover:bg-[#F6F4EF]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#252820]">{as.title}</span>
                          <span className="text-[10px] font-bold text-[#72766B] px-2 py-0.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded">
                            {as.subject}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#72766B] block">
                          Deadline: {as.deadline.replace('T', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {as.isSubmitted ? (
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-[#426B52] bg-[#A8B99A]/20 border border-[#A8B99A]/40 px-2.5 py-1 rounded-full inline-block">
                              Submitted ✓
                            </span>
                            {as.marks !== null && (
                              <span className="block text-[10px] font-bold text-[#252820] mt-0.5">
                                Marks: {as.marks}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-extrabold text-[#C77952] bg-[#C77952]/10 border border-[#C77952]/30 px-2.5 py-1 rounded-full">
                            Pending Submission
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#72766B] bg-[#F6F4EF] rounded-xl border border-[#E5E1D8]">
                  No assignments currently scheduled for your enrolled classes.
                </div>
              )}
            </div>

            {/* Section 3: Verified Skills Inventory */}
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-[#252820]">Verified Skills Inventory</h3>
                <span className="text-xs font-bold text-[#426B52]">
                  {trackerData?.skills?.total ?? skillPathData?.skills?.length ?? 0} Technical Competencies
                </span>
              </div>
              <p className="text-xs text-[#72766B]">
                Breakdown of competencies validated across personal projects, course laboratories, and self-learning modules.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] text-center">
                  <span className="text-[10px] font-bold text-[#72766B] uppercase block">Beginner</span>
                  <span className="text-xl font-black text-[#252820] mt-1 block">
                    {trackerData?.skills?.byProficiency?.beginner ?? 0}
                  </span>
                  <span className="text-[10px] text-[#72766B]">Building foundation</span>
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] text-center">
                  <span className="text-[10px] font-bold text-[#72766B] uppercase block">Intermediate</span>
                  <span className="text-xl font-black text-[#426B52] mt-1 block">
                    {trackerData?.skills?.byProficiency?.intermediate ?? 0}
                  </span>
                  <span className="text-[10px] text-[#72766B]">Applied in coursework</span>
                </div>
                <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] text-center">
                  <span className="text-[10px] font-bold text-[#72766B] uppercase block">Advanced</span>
                  <span className="text-xl font-black text-[#C77952] mt-1 block">
                    {trackerData?.skills?.byProficiency?.advanced ?? 0}
                  </span>
                  <span className="text-[10px] text-[#72766B]">Production ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: CAREER EVALUATION */}
        {tab === 'EVALUATION' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252820]">Understand Your Career Readiness.</h2>
                <p className="text-xs text-[#72766B] mt-1">Review your latest evaluation, strengths, skill gaps and recommended improvements.</p>
              </div>
              <button
                onClick={handleRunScoringAgent}
                disabled={runningAgent === 'WF-02'}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-4 h-4 text-[#A8B99A]" /> {runningAgent === 'WF-02' ? 'Evaluating...' : 'Evaluate Profile'}
              </button>
            </div>

            {/* Score Breakdown Cards */}
            {!skillPathData?.latestScoringReport ? (
              <div className="p-8 text-center bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl space-y-2">
                <h4 className="font-extrabold text-sm text-[#252820]">Ready to Discover Where You Stand?</h4>
                <p className="text-xs text-[#72766B] max-w-sm mx-auto">Complete your learner profile to begin your career readiness evaluation.</p>
                <div className="pt-2">
                  <button
                    onClick={handleRunScoringAgent}
                    disabled={runningAgent === 'WF-02'}
                    className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#A8B99A]" /> Evaluate My Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Overall</span>
                    <span className="text-2xl font-black text-[#426B52] mt-1 block">{skillPathData.latestScoringReport.overallScore}%</span>
                  </div>
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Tech Skills</span>
                    <span className="text-2xl font-black text-[#252820] mt-1 block">{skillPathData.latestScoringReport.technicalSkillsScore}%</span>
                  </div>
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Projects</span>
                    <span className="text-2xl font-black text-[#252820] mt-1 block">{skillPathData.latestScoringReport.projectScore}%</span>
                  </div>
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Certs</span>
                    <span className="text-2xl font-black text-[#252820] mt-1 block">{skillPathData.latestScoringReport.certificationScore}%</span>
                  </div>
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Portfolio</span>
                    <span className="text-2xl font-black text-[#252820] mt-1 block">{skillPathData.latestScoringReport.portfolioScore}%</span>
                  </div>
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="text-[10px] font-bold text-[#72766B] block uppercase">Career Prep</span>
                    <span className="text-2xl font-black text-[#C77952] mt-1 block">{skillPathData.latestScoringReport.careerPreparationScore}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
                    <h3 className="font-extrabold text-[#426B52] text-sm mb-3">Verified Strengths</h3>
                    <ul className="space-y-2 text-xs text-[#252820]">
                      {skillPathData.latestScoringReport.strengths.map((str: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-[#426B52] shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
                    <h3 className="font-extrabold text-[#C77952] text-sm mb-3">Growth Opportunities</h3>
                    <ul className="space-y-2 text-xs text-[#252820]">
                      {skillPathData.latestScoringReport.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#C77952] shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: ATTENDANCE LEDGER (Preserved academic module) */}
        {tab === 'ATTENDANCE' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#252820]">Attendance Ledger</h2>
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-[#E5E1D8] text-[#72766B] font-bold uppercase tracking-wider">
                    <th className="pb-3">Subject Name</th>
                    <th className="pb-3">Faculty Code</th>
                    <th className="pb-3">Held</th>
                    <th className="pb-3">Present</th>
                    <th className="pb-3">Absent</th>
                    <th className="pb-3">Percentage</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]">
                  {(attendance?.subjects || []).map((sub: any, i: number) => (
                    <tr key={i} className="text-[#252820]">
                      <td className="py-4">
                        <div className="font-bold text-[#252820]">{sub.subjectName}</div>
                        <div className="text-[10px] text-[#72766B] mt-0.5">{sub.subjectCode}</div>
                      </td>
                      <td className="py-4 text-[#72766B]">{sub.facultyName}</td>
                      <td className="py-4">{sub.classesHeld}</td>
                      <td className="py-4 text-[#426B52] font-bold">{sub.present}</td>
                      <td className="py-4 text-[#C77952] font-bold">{sub.absent}</td>
                      <td className="py-4 font-bold text-[#252820]">{sub.percentage}%</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          sub.status === 'GOOD' ? 'bg-[#A8B99A]/20 text-[#426B52] border-[#A8B99A]/40' :
                          sub.status === 'WARNING' ? 'bg-[#C77952]/15 text-[#C77952] border-[#C77952]/30' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: STUDY MATERIALS (Preserved academic module) */}
        {tab === 'MATERIALS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#252820]">Study Materials & Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.length === 0 ? (
                <p className="text-sm text-[#72766B] col-span-full text-center py-8">No class notes uploaded yet.</p>
              ) : (
                materials.map((mat: any) => (
                  <div key={mat.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/30 text-[10px] font-bold rounded uppercase">{mat.category}</span>
                        <span className="text-[10px] text-[#72766B] font-semibold">{mat.subject?.code}</span>
                      </div>
                      <h4 className="font-bold text-[#252820] text-sm mb-1">{mat.title}</h4>
                      <p className="text-xs text-[#72766B] line-clamp-2 leading-relaxed mb-4">{mat.description}</p>
                    </div>
                    <div className="border-t border-[#E5E1D8] pt-3 flex items-center justify-between text-xs">
                      <span className="text-[#72766B] font-bold">Size: {Math.round(mat.fileSize / 1024)} KB</span>
                      <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="text-[#426B52] font-extrabold hover:underline">Download File →</a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 12: ASSIGNMENTS (Preserved academic module) */}
        {tab === 'ASSIGNMENTS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#252820]">Assignments & Project Handins</h2>
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <p className="text-sm text-[#72766B] text-center py-8">No assigned handins found.</p>
              ) : (
                assignments.map((as: any) => {
                  const hasSubmitted = as.submissions && as.submissions.length > 0;
                  return (
                    <div key={as.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-[#252820] text-sm mb-1">{as.title}</h4>
                        <p className="text-xs text-[#72766B] leading-relaxed mb-2">{as.description}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] font-bold text-[#72766B]">
                          <span>DEADLINE: {new Date(as.deadline).toLocaleString()}</span>
                          <span>MAX MARKS: {as.maxMarks}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {hasSubmitted ? (
                          <div className="text-right">
                            <span className="px-2.5 py-1 bg-[#A8B99A]/20 text-[#426B52] border border-[#A8B99A]/40 text-xs font-bold rounded-lg">
                              Submitted ✓
                            </span>
                            {as.submissions[0].marksObtained !== null && (
                              <div className="text-xs text-[#252820] font-black mt-2">
                                Graded: {as.submissions[0].marksObtained}/{as.maxMarks}
                              </div>
                            )}
                          </div>
                        ) : submittingFileId === as.id ? (
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="Submit URL (e.g. S3/Drive)"
                              value={fileUrl}
                              onChange={(e) => setFileUrl(e.target.value)}
                              className="px-3 py-1.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-lg text-xs text-[#252820] focus:outline-none"
                            />
                            <button
                              onClick={() => submitAssignment(as.id)}
                              className="px-3 py-1.5 bg-[#426B52] text-white font-bold text-xs rounded-lg"
                            >
                              Submit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSubmittingFileId(as.id)}
                            className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                          >
                            Upload Submission
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 13: CAMPUS CONNECTIONS (Preserved academic module) */}
        {tab === 'CONNECTIONS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-[#252820]">Campus Connection Network</h2>
            
            <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-6 shadow-sm">
              <form onSubmit={requestConnection} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter peer student Roll Number e.g. STU1002"
                  value={peerRoll}
                  onChange={(e) => setPeerRoll(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
                <button
                  type="submit"
                  disabled={connectingPeer}
                  className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Connect
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.length === 0 ? (
                <p className="text-sm text-[#72766B] col-span-full text-center py-8">No connections made yet.</p>
              ) : (
                connections.map((c) => (
                  <div key={c.id} className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={c.peer?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'} alt="avatar" className="w-12 h-12 rounded-full border border-[#E5E1D8] object-cover" />
                      <div>
                        <h4 className="font-bold text-[#252820] text-sm">{c.peer?.name}</h4>
                        <p className="text-[10px] text-[#72766B] font-bold">{c.peer?.studentId} • {c.status}</p>
                      </div>
                    </div>
                    {c.status === 'PENDING' && (
                      <button
                        onClick={() => acceptConnection(c.id)}
                        className="px-3 py-1 bg-[#426B52] hover:bg-[#365843] text-white font-bold text-[10px] rounded-lg transition-colors"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: LEARNER SUMMARY (Reference Screenshot)      */}
      {/* ========================================================= */}
      <aside className="w-full lg:w-80 xl:w-88 shrink-0 bg-[#FFFEFC] rounded-[28px] border border-[#E5E1D8] shadow-xs p-6 space-y-6 lg:sticky lg:top-6">
        
        {/* Top Header Icons (Chat & Settings) */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open Chat Assistant"
            className="w-9 h-9 rounded-full bg-[#F6F4EF] hover:bg-[#E5E1D8] border border-[#E5E1D8] flex items-center justify-center text-[#252820] transition-colors relative cursor-pointer"
            title="Course Chat Agent"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#426B52]" />
          </button>

          <button
            onClick={() => setTab('PROFILE')}
            aria-label="Profile Settings"
            className="w-9 h-9 rounded-full bg-[#F6F4EF] hover:bg-[#E5E1D8] border border-[#E5E1D8] flex items-center justify-center text-[#72766B] hover:text-[#252820] transition-colors cursor-pointer"
            title="Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.name || 'Learner'}
                className="w-20 h-20 rounded-full border-2 border-[#E5E1D8] object-cover ring-4 ring-[#F6F4EF] mx-auto shadow-2xs"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#426B52] text-[#FFFEFC] font-serif font-black text-2xl flex items-center justify-center border-2 border-[#E5E1D8] ring-4 ring-[#F6F4EF] mx-auto shadow-2xs">
                {(user?.name || 'Learner').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-serif font-black text-lg text-[#252820]">
              {user?.name || 'Learner'}
            </h2>
            <p className="text-xs text-[#72766B] font-semibold mt-0.5">
              {skillPathData?.currentCareerGoal?.primaryRole || 'Full Stack Developer'}
            </p>
          </div>
        </div>

        {/* 3 Metric Cards in a Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Point */}
          <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
            <Heart className="w-4 h-4 text-[#C77952] mb-1 fill-[#C77952]" />
            <span className="text-sm font-black text-[#252820]">
              {skillPathData?.latestScoringReport?.overallScore ?? user?.points ?? 0}
            </span>
            <span className="text-[10px] font-bold text-[#72766B] uppercase">Point</span>
          </div>

          {/* Badges / Skills */}
          <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
            <Award className="w-4 h-4 text-[#426B52] mb-1" />
            <span className="text-sm font-black text-[#252820]">
              {skillPathData?.skills?.length ?? 0}
            </span>
            <span className="text-[10px] font-bold text-[#72766B] uppercase">Badges</span>
          </div>

          {/* Certificates */}
          <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center">
            <Bookmark className="w-4 h-4 text-[#7C3AED] mb-1 fill-[#7C3AED]" />
            <span className="text-sm font-black text-[#252820]">
              {skillPathData?.certifications?.length ?? 0}
            </span>
            <span className="text-[10px] font-bold text-[#72766B] uppercase">Certificates</span>
          </div>
        </div>

        {/* Activity Section */}
        {(() => {
          const totalContents = (materials?.length || 0) + (assignments?.length || 0);
          const completedAssignments = (assignments || []).filter((a: any) => a.submissions?.some((s: any) => s.status === 'GRADED' || s.grade !== null)).length;
          const submittedAssignments = (assignments || []).filter((a: any) => a.submissions?.some((s: any) => s.status === 'SUBMITTED')).length;
          
          const passedPct = totalContents > 0 ? Math.round((completedAssignments / totalContents) * 100) : 0;
          const inReviewPct = totalContents > 0 ? Math.round((submittedAssignments / totalContents) * 100) : 0;
          const inProgressPct = totalContents > 0 ? Math.max(0, 100 - passedPct - inReviewPct) : 0;

          const circ = 377;
          const passedDash = (passedPct / 100) * circ;
          const inReviewDash = (inReviewPct / 100) * circ;
          const inProgressDash = (inProgressPct / 100) * circ;

          return (
            <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#72766B] uppercase tracking-wider block">Activity</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black text-[#252820]">
                      {trackerData?.studyHours?.logged ?? 0}h
                    </span>
                    <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                      {(trackerData?.studyHours?.logged || 0) >= 10 ? 'Great result! 👏' : (trackerData?.studyHours?.logged || 0) > 0 ? 'On Track 👍' : 'Start Today 🎯'}
                    </span>
                  </div>
                </div>

                {/* Timeframe Selector */}
                <div className="relative">
                  <button
                    onClick={() => setActivityTimeframe(activityTimeframe === 'Week' ? 'Year' : 'Week')}
                    className="px-2.5 py-1 bg-[#FFFEFC] border border-[#E5E1D8] rounded-xl text-[10px] font-black text-[#252820] flex items-center gap-1 cursor-pointer hover:border-[#426B52] transition-colors"
                  >
                    <span>{activityTimeframe}</span>
                    <ChevronDown className="w-3 h-3 text-[#72766B]" />
                  </button>
                </div>
              </div>

              {/* Multi-segment Donut Ring Chart */}
              <div className="relative flex items-center justify-center py-2">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
                  {/* Background Ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#E5E1D8"
                    strokeWidth="18"
                    fill="none"
                  />
                  {totalContents > 0 && passedDash > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="#A8B99A"
                      strokeWidth="18"
                      strokeDasharray={`${passedDash} ${circ}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                  {totalContents > 0 && inReviewDash > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="#E0A96D"
                      strokeWidth="18"
                      strokeDasharray={`${inReviewDash} ${circ}`}
                      strokeDashoffset={`-${passedDash}`}
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                  {totalContents > 0 && inProgressDash > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="#6B8EAD"
                      strokeWidth="18"
                      strokeDasharray={`${inProgressDash} ${circ}`}
                      strokeDashoffset={`-${passedDash + inReviewDash}`}
                      strokeLinecap="round"
                      fill="none"
                    />
                  )}
                </svg>

                {/* Donut Center Count */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-extrabold text-[#72766B] uppercase tracking-wider">
                    Contents
                  </span>
                  <span className="text-2xl font-black text-[#252820]">
                    {totalContents}
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-3 pt-1 border-t border-[#E5E1D8]/60 text-[10px] font-bold text-[#72766B]">
                {totalContents === 0 ? (
                  <span className="text-[#72766B] italic">No active coursework yet</span>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#A8B99A]" />
                      <span className="text-[#252820]">Passed {passedPct}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E0A96D]" />
                      <span>Review {inReviewPct}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#6B8EAD]" />
                      <span>In Progress {inProgressPct}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Two Bottom Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Study Content */}
          <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-3 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-[#FDF1EB] text-[#C77952] flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-sm font-black text-[#252820]">
                {materials.length}
              </span>
              <span className="text-[10px] font-bold text-[#72766B]">Content</span>
            </div>
            <button
              onClick={() => setTab('MATERIALS')}
              className="mt-2 text-[10px] font-extrabold text-[#426B52] hover:underline self-start cursor-pointer"
            >
              View all
            </button>
          </div>

          {/* Card 2: Learning Tasks */}
          <div className="bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl p-3 flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-sm font-black text-[#252820]">
                {assignments.length}
              </span>
              <span className="text-[10px] font-bold text-[#72766B]">Learning</span>
            </div>
            <button
              onClick={() => setTab('ASSIGNMENTS')}
              className="mt-2 text-[10px] font-extrabold text-[#426B52] hover:underline self-start cursor-pointer"
            >
              View all
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setLogHoursModalOpen(true)}
          className="w-full py-2.5 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Study Time</span>
        </button>
      </aside>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADJUST MENTOR RECOMMENDATION                     */}
      {/* ========================================================= */}
      {adjustModalRec && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#426B52]" />
                <h3 className="font-extrabold text-sm text-[#252820]">Adjust Study Guidance</h3>
              </div>
              <button
                onClick={() => setAdjustModalRec(null)}
                className="text-[#72766B] hover:text-[#252820] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-[#72766B] uppercase tracking-wider text-[10px] block mb-1">Recommendation</span>
                <p className="font-bold text-[#252820] bg-[#F6F4EF] p-2.5 rounded-xl border border-[#E5E1D8]">
                  {adjustModalRec.title}
                </p>
              </div>

              <div>
                <label className="font-bold text-[#72766B] block mb-1">Target Timeframe</label>
                <input
                  type="text"
                  value={adjustTimeframe}
                  onChange={(e) => setAdjustTimeframe(e.target.value)}
                  placeholder="e.g. Next 48 Hours, Wednesday & Saturday, This Weekend"
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
              </div>

              <div>
                <label className="font-bold text-[#72766B] block mb-1">Personal Study Note / Schedule Focus</label>
                <textarea
                  rows={3}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Reserve 90 mins after DBMS lab; review lecture slide 2 before solving problem sets."
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E1D8]">
              <button
                onClick={() => setAdjustModalRec(null)}
                className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-[#252820] text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Save to Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOG STUDY SESSION                                */}
      {/* ========================================================= */}
      {logHoursModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFEFC] border border-[#E5E1D8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#426B52]" />
                <h3 className="font-extrabold text-sm text-[#252820]">Log Focused Study Session</h3>
              </div>
              <button
                onClick={() => setLogHoursModalOpen(false)}
                className="text-[#72766B] hover:text-[#252820] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogStudyHoursSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#72766B] block mb-1">Study Hours Completed</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    value={hoursInput}
                    onChange={(e) => setHoursInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-sm font-bold text-[#252820] focus:outline-none focus:border-[#426B52]"
                  />
                  <span className="text-xs text-[#72766B]">hours toward weekly commitment</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#72766B] block mb-1">Subject or Topic Studied</label>
                <input
                  type="text"
                  value={logTopicInput}
                  onChange={(e) => setLogTopicInput(e.target.value)}
                  placeholder="e.g. Database Indexing, React hooks, DSA trees"
                  className="w-full px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52]"
                />
              </div>

              <div className="p-3 bg-[#F6F4EF] rounded-xl border border-[#E5E1D8] text-[11px] text-[#72766B]">
                This action immediately increments your tracked learning velocity in the Learning Tracker and updates your pacing for AI Mentor recommendations.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setLogHoursModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F6F4EF] text-[#252820] text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingHours}
                  className="px-4 py-2 bg-[#426B52] hover:bg-[#365843] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {loggingHours ? 'Logging...' : 'Confirm & Log Hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COORDINATED FEATURE 1: COURSE & STUDY CHAT AGENT DRAWER   */}
      {/* ========================================================= */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open Course & Study Assistant"
            className="w-14 h-14 bg-[#426B52] hover:bg-[#365843] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all group"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="sr-only">Open Course & Study Assistant</span>
          </button>
        ) : (
          <div className="w-88 sm:w-[420px] h-[550px] bg-[#FFFEFC] border border-[#E5E1D8] rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="p-4 bg-[#252820] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#426B52] flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-[#A8B99A]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-[#FFFEFC] leading-none">GoWithFlow AI Mentor</h3>
                  <p className="text-[10px] text-[#A8B99A] font-semibold mt-1">Contextual career intelligence &amp; study guidance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatMessages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="text-[#A8B99A] hover:text-[#FFFEFC] text-xs p-1"
                    title="Clear conversation history"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-[#A8B99A] hover:text-[#FFFEFC] font-bold text-sm p-1"
                  aria-label="Close assistant"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Empty State with Suggested Prompts */}
              {chatMessages.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#426B52] font-extrabold">
                      <GraduationCap className="w-4 h-4" />
                      <span>Hello, {user?.name || 'Learner'}. Ready to make your next move?</span>
                    </div>
                    <p className="text-[#252820]/80 leading-relaxed text-[11px]">
                      I understand your learning journey, current skills and career goals. Ask me anything about your roadmap, skill development or career direction.
                    </p>
                    <div className="text-[10px] text-[#72766B] font-semibold pt-1">
                      &bull; Answers strictly respect your verified learner profile and coursework context.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#72766B] px-1 block">
                      Suggested Conversation Starters:
                    </span>
                    <div className="space-y-1.5">
                      {[
                        'Analyze my current skills.',
                        'Explain my biggest skill gaps.',
                        'Help me understand my roadmap.',
                        'Recommend a practical project.',
                        'Prepare me for my target career.',
                        'Create my learning plan for this week.'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendChatMessage(prompt)}
                          className="w-full text-left p-2.5 bg-[#FFFEFC] hover:bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] font-semibold transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate pr-2">{prompt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#72766B] group-hover:text-[#426B52] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Conversation Messages */
                chatMessages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'} space-y-1`}>
                    <div
                      className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                        m.sender === 'USER'
                          ? 'bg-[#426B52] text-white rounded-tr-xs'
                          : m.isError
                          ? 'bg-[#C77952]/10 border border-[#C77952]/40 text-[#252820] rounded-tl-xs'
                          : 'bg-[#F6F4EF] border border-[#E5E1D8] text-[#252820] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {m.sender === 'USER' ? (
                        <div className="whitespace-pre-line text-xs font-normal">
                          {m.text}
                        </div>
                      ) : (
                        renderFormattedMessage(m.text)
                      )}

                      {/* Source References Pill */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#E5E1D8] space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#72766B] block">
                            Verified Course Materials:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {m.sources.map((src, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFFEFC] border border-[#E5E1D8] rounded-md text-[10px] font-bold text-[#252820]"
                              >
                                <FileText className="w-3 h-3 text-[#426B52]" />
                                <span className="truncate max-w-[200px]">{src.title}</span>
                                <span className="text-[#72766B]">({src.subject})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error State with Retry Button */}
                      {m.isError && (
                        <div className="mt-2 pt-2 border-t border-[#C77952]/30 flex justify-end">
                          <button
                            onClick={handleRetryChat}
                            className="px-3 py-1 bg-[#C77952] hover:bg-[#b06742] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry Query
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[#72766B] px-1 font-semibold">
                      {m.timestamp}
                    </span>
                  </div>
                ))
              )}

              {/* Thinking Indicator */}
              {chatSending && (
                <div className="flex items-center gap-2 p-3 bg-[#F6F4EF] border border-[#E5E1D8] rounded-2xl w-fit text-xs text-[#72766B] font-semibold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-[#426B52] animate-spin" />
                  <span>Assistant is analyzing course materials & schedule...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-3 border-t border-[#E5E1D8] flex gap-2 bg-[#FFFEFC]">
              <input
                type="text"
                required
                placeholder="Ask about syllabus, lecture slides, assignments..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatSending}
                className="flex-1 px-3 py-2 bg-[#F6F4EF] border border-[#E5E1D8] rounded-xl text-xs text-[#252820] focus:outline-none focus:border-[#426B52] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                aria-label="Send message"
                className="w-9 h-9 bg-[#252820] hover:bg-[#34382D] text-white rounded-xl flex items-center justify-center shrink-0 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
