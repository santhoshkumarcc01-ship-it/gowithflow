'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, BookOpen, Layers, Cpu, Users, Megaphone, Calendar, 
  CheckCircle2, AlertTriangle, LogOut, ArrowUpRight, FolderPlus, Plus, UserCheck 
} from 'lucide-react';

export default function FacultyDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'MATERIALS' | 'ASSIGNMENTS'>('OVERVIEW');
  const [user, setUser] = useState<any>(null);

  // States
  const [metrics, setMetrics] = useState<any>({ classesCount: 0, materialsCount: 0, riskStudents: [] });
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance taking states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: string }>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Material upload states
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDesc, setMaterialDesc] = useState('');
  const [materialCat, setMaterialCat] = useState<'NOTE' | 'PDF' | 'VIDEO' | 'LAB' | 'REFERENCE' | 'ASSIGNMENT' | 'OTHER'>('PDF');
  const [materialUrl, setMaterialUrl] = useState('');
  const [publishingMaterial, setPublishingMaterial] = useState(false);

  // Assignment states
  const [assignments, setAssignments] = useState<any[]>([]);
  const [newAssignment, setNewAssignment] = useState({ title: '', desc: '', deadline: '2026-08-25T23:59', maxMarks: '100' });
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.success || json.user.role !== 'FACULTY') {
        router.push('/login');
      } else {
        setUser(json.user);
        fetchFacultyData();
      }
    } catch {
      router.push('/login');
    }
  };

  const fetchFacultyData = async () => {
    setLoading(true);
    try {
      const [mRes, cRes, aRes] = await Promise.all([
        fetch('/api/faculty/dashboard').then(r => r.json()),
        fetch('/api/faculty/classes').then(r => r.json()),
        fetch('/api/faculty/assignments').then(r => r.json())
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (cRes.success) {
        setClasses(cRes.data);
        if (cRes.data.length > 0) {
          setSelectedClassId(cRes.data[0].id);
          setSelectedSubjectId(cRes.data[0].subjectId);
          fetchClassStudents(cRes.data[0].id);
        }
      }
      if (aRes.success) {
        setAssignments(aRes.data);
        if (aRes.data.length > 0) {
          setSelectedAssignmentId(aRes.data[0].id);
          fetchSubmissions(aRes.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    try {
      const res = await fetch(`/api/faculty/classes/${classId}/students`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data);
        // Default everyone to present
        const initialRecords: any = {};
        json.data.forEach((s: any) => {
          initialRecords[s.id] = 'PRESENT';
        });
        setAttendanceRecords(initialRecords);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClassId(classId);
    const cls = classes.find(c => c.id === classId);
    if (cls) {
      setSelectedSubjectId(cls.subjectId);
    }
    fetchClassStudents(classId);
  };

  const toggleAttendance = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const submitAttendance = async () => {
    setSubmittingAttendance(true);
    const recordsPayload = Object.keys(attendanceRecords).map(sId => ({
      studentId: sId,
      status: attendanceRecords[sId]
    }));

    try {
      const res = await fetch('/api/faculty/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSectionId: selectedClassId,
          subjectId: selectedSubjectId,
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '10:30',
          records: recordsPayload
        })
      });

      const json = await res.json();
      if (json.success) {
        alert('Attendance records submitted successfully!');
        // Refresh dashboard metrics
        const mRes = await fetch('/api/faculty/dashboard').then(r => r.json());
        if (mRes.success) setMetrics(mRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const uploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingMaterial(true);

    try {
      const res = await fetch('/api/faculty/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          classSectionId: selectedClassId,
          title: materialTitle,
          description: materialDesc,
          category: materialCat,
          fileUrl: materialUrl,
          fileName: materialUrl.split('/').pop() || 'resource.pdf',
          fileSize: 1048576, // mock 1MB
          mimeType: 'application/pdf'
        })
      });

      const json = await res.json();
      if (json.success) {
        setMaterialTitle('');
        setMaterialDesc('');
        setMaterialUrl('');
        alert('Study resource published successfully!');
        const mRes = await fetch('/api/faculty/dashboard').then(r => r.json());
        if (mRes.success) setMetrics(mRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingMaterial(false);
    }
  };

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/faculty/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          classSectionId: selectedClassId,
          title: newAssignment.title,
          description: newAssignment.desc,
          deadline: newAssignment.deadline,
          maxMarks: newAssignment.maxMarks
        })
      });

      const json = await res.json();
      if (json.success) {
        setNewAssignment({ title: '', desc: '', deadline: '2026-08-25T23:59', maxMarks: '100' });
        alert('Assignment published successfully!');
        const aRes = await fetch('/api/faculty/assignments').then(r => r.json());
        if (aRes.success) setAssignments(aRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubmissions = async (asId: string) => {
    try {
      const res = await fetch(`/api/faculty/assignments/${asId}/submissions`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const asId = e.target.value;
    setSelectedAssignmentId(asId);
    fetchSubmissions(asId);
  };

  const submitGrade = async (subId: string) => {
    try {
      const res = await fetch(`/api/faculty/submissions/${subId}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks: Number(marks), feedback })
      });
      const json = await res.json();
      if (json.success) {
        setMarks('');
        setFeedback('');
        setGradingSubId(null);
        alert('Grade saved successfully!');
        fetchSubmissions(selectedAssignmentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 animate-pulse text-sm">
        Syncing Faculty Console...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-wide">FACULTY DESK</span>
          </div>

          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'} alt="avatar" className="w-10 h-10 rounded-full border border-slate-700 object-cover" />
              <div>
                <h4 className="font-bold text-xs truncate max-w-[140px]">{user.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{user.facultyDetails?.facultyId} • {user.facultyDetails?.department}</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-xs font-bold text-slate-400">
            <button
              onClick={() => setTab('OVERVIEW')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" /> Workspace Overview
            </button>
            <button
              onClick={() => setTab('ATTENDANCE')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'ATTENDANCE' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <UserCheck className="w-4 h-4" /> Take Attendance
            </button>
            <button
              onClick={() => setTab('MATERIALS')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'MATERIALS' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <FolderPlus className="w-4 h-4" /> Publish Resources
            </button>
            <button
              onClick={() => setTab('ASSIGNMENTS')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'ASSIGNMENTS' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BookOpen className="w-4 h-4" /> Grade Book
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs font-bold text-slate-400">
          <button
            onClick={handleLogout}
            className="w-full text-left py-2.5 px-4 rounded-xl hover:bg-red-950 hover:text-red-400 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">

        {/* TAB 1: OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">Faculty Console</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Subjects</span>
                <span className="block text-3xl font-extrabold text-blue-600 mt-2">{metrics.classesCount}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Files Uploaded</span>
                <span className="block text-3xl font-extrabold text-indigo-600 mt-2">{metrics.materialsCount}</span>
              </div>
            </div>

            {/* Attendance alert list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
                Student Low Attendance Alerts (Risk Threshold &lt; 75%)
              </h2>
              <div className="space-y-3">
                {metrics.riskStudents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">All students meet the 75% attendance criteria.</p>
                ) : (
                  metrics.riskStudents.map((st: any) => (
                    <div key={st.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="text-slate-400 ml-2">({st.studentId} • {st.courseCode})</span>
                      </div>
                      <span className="text-red-600 font-black">{st.percentage}% Attendance</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {tab === 'ATTENDANCE' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Take Class Attendance</h2>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Active Class Section</label>
              <select
                value={selectedClassId}
                onChange={handleClassChange}
                className="w-full md:w-80 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.subjectName} ({c.section}) - {c.room}</option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <h3 className="font-bold text-sm text-slate-900 mb-4 uppercase">Roll sheets checklist</h3>
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Roll No</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3 text-center">Present</th>
                    <th className="pb-3 text-center">Absent</th>
                    <th className="pb-3 text-center">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="text-slate-700">
                      <td className="py-3 text-slate-500 font-mono">{st.studentId}</td>
                      <td className="py-3 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3 text-center">
                        <input
                          type="radio"
                          name={`att_${st.id}`}
                          checked={attendanceRecords[st.id] === 'PRESENT'}
                          onChange={() => toggleAttendance(st.id, 'PRESENT')}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="radio"
                          name={`att_${st.id}`}
                          checked={attendanceRecords[st.id] === 'ABSENT'}
                          onChange={() => toggleAttendance(st.id, 'ABSENT')}
                          className="w-4 h-4 accent-red-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="radio"
                          name={`att_${st.id}`}
                          checked={attendanceRecords[st.id] === 'LATE'}
                          onChange={() => toggleAttendance(st.id, 'LATE')}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={submitAttendance}
                  disabled={submittingAttendance || students.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {submittingAttendance ? 'Saving...' : 'Submit Attendance Roll'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATERIALS */}
        {tab === 'MATERIALS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Publish Class Resources</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <form onSubmit={uploadMaterial} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Target Class Section</label>
                    <select
                      value={selectedClassId}
                      onChange={handleClassChange}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.subjectName} ({c.section})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Resource Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lecture 4 Slides: Node APIs"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Resource Description</label>
                  <textarea
                    placeholder="Short summary of files contents..."
                    value={materialDesc}
                    onChange={(e) => setMaterialDesc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Category type</label>
                    <select
                      value={materialCat}
                      onChange={(e: any) => setMaterialCat(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    >
                      <option value="PDF">PDF slide</option>
                      <option value="NOTE">Lecture notes</option>
                      <option value="VIDEO">Video Link</option>
                      <option value="LAB">Lab Worksheet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Resource Download URL Link</label>
                    <input
                      type="text"
                      required
                      placeholder="https://apex.edu/files/resource.pdf"
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={publishingMaterial}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  {publishingMaterial ? 'Publishing...' : 'Publish resource'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: ASSIGNMENTS */}
        {tab === 'ASSIGNMENTS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Grade Homework Submissions</h2>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1 font-sans">Select Assignment</label>
                <select
                  value={selectedAssignmentId}
                  onChange={handleAssignmentChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.subject.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <h3 className="font-bold text-sm text-slate-900 mb-4 uppercase">Submissions ledger</h3>
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Roll No</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Submitted At</th>
                    <th className="pb-3">File Sheet</th>
                    <th className="pb-3">Marks</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="text-slate-700">
                      <td className="py-4 font-mono">{sub.studentRollCode}</td>
                      <td className="py-4 font-bold text-slate-900">{sub.studentName}</td>
                      <td className="py-4 text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      <td className="py-4">
                        <a href={sub.fileUrl} target="_blank" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                          File <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="py-4 font-bold text-slate-900">{sub.marks !== null ? `${sub.marks}` : '—'}</td>
                      <td className="py-4 text-right">
                        {gradingSubId === sub.id ? (
                          <div className="inline-flex gap-2 items-center">
                            <input
                              type="number"
                              required
                              placeholder="Marks"
                              value={marks}
                              onChange={(e) => setMarks(e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Feedback"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none"
                            />
                            <button
                              onClick={() => submitGrade(sub.id)}
                              className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setGradingSubId(null)}
                              className="px-2 py-1 border border-slate-200 text-slate-600 rounded-lg"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setGradingSubId(sub.id); setMarks(String(sub.marks || '')); setFeedback(sub.feedback || ''); }}
                            className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px]"
                          >
                            Grade Work
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
