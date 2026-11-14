'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, BookOpen, Layers, Cpu, Users, Megaphone, Calendar, 
  ShieldAlert, Settings, LogOut, FileSpreadsheet, Plus, Search 
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'OVERVIEW' | 'STUDENTS' | 'FACULTY' | 'AUDIT_LOGS'>('OVERVIEW');
  const [user, setUser] = useState<any>(null);

  // States
  const [metrics, setMetrics] = useState<any>({ studentsCount: 0, facultyCount: 0, classesCount: 0, auditLogs: [] });
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination for student CRUD
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form states - Add Student
  const [newStudent, setNewStudent] = useState({
    name: '', email: '', phoneNumber: '', studentId: '', departmentId: '', year: '1', semester: '1', section: 'A'
  });
  // Form states - Add Faculty
  const [newFaculty, setNewFaculty] = useState({
    name: '', email: '', phoneNumber: '', facultyId: '', departmentId: '', designation: 'Assistant Professor'
  });
  
  // CSV Import State
  const [csvText, setCsvText] = useState('John Doe,john.doe@apex.edu,+919988770001,STU5001\nJane Smith,jane.smith@apex.edu,+919988770002,STU5002');
  const [importingCsv, setImportingCsv] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (!json.success || json.user.role !== 'ADMIN') {
        router.push('/login');
      } else {
        setUser(json.user);
        fetchAdminData();
      }
    } catch {
      router.push('/login');
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        fetch('/api/admin/dashboard').then(r => r.json()),
        fetch('/api/admin/departments').then(r => r.json())
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (dRes.success) {
        setDepartments(dRes.data);
        if (dRes.data.length > 0) {
          setNewStudent(prev => ({ ...prev, departmentId: dRes.data[0].id }));
          setNewFaculty(prev => ({ ...prev, departmentId: dRes.data[0].id }));
        }
      }

      fetchStudents();
      fetchFaculty();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/admin/students?page=${studentPage}&search=${studentSearch}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await fetch('/api/admin/faculty');
      const json = await res.json();
      if (json.success) {
        setFaculty(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [studentPage, studentSearch]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const academicYearId = departments[0]?.collegeId || ''; // fetch default college link from dept
      // First get active academic year
      const ayRes = await fetch('/api/admin/dashboard'); // simple endpoint mockup or mock
      const ayId = '2026-2027'; // let's just query or set standard seed link

      // We'll query academic year from departments list
      const depts = await fetch('/api/admin/departments').then(r => r.json());
      
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          academicYearId: depts.data?.[0]?.collegeId || 'ay-id'
        })
      });

      const json = await res.json();
      if (json.success) {
        setNewStudent({
          name: '', email: '', phoneNumber: '', studentId: '', departmentId: departments[0]?.id || '', year: '1', semester: '1', section: 'A'
        });
        alert('Student created successfully!');
        fetchStudents();
        const mRes = await fetch('/api/admin/dashboard').then(r => r.json());
        if (mRes.success) setMetrics(mRes.data);
      } else {
        alert(json.error?.message || 'Failed to create student.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaculty)
      });
      const json = await res.json();
      if (json.success) {
        setNewFaculty({
          name: '', email: '', phoneNumber: '', facultyId: '', departmentId: departments[0]?.id || '', designation: 'Assistant Professor'
        });
        alert('Faculty created successfully!');
        fetchFaculty();
        const mRes = await fetch('/api/admin/dashboard').then(r => r.json());
        if (mRes.success) setMetrics(mRes.data);
      } else {
        alert(json.error?.message || 'Failed to create faculty profile.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportingCsv(true);

    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvText })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Successfully imported ${json.data.count} students!`);
        fetchStudents();
        const mRes = await fetch('/api/admin/dashboard').then(r => r.json());
        if (mRes.success) setMetrics(mRes.data);
      } else {
        alert(json.error?.message || 'CSV Import failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImportingCsv(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 animate-pulse text-sm">
        Opening Admin Desk Panel...
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
            <span className="font-black text-sm tracking-wide">ADMIN CENTER</span>
          </div>

          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src={user.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'} alt="avatar" className="w-10 h-10 rounded-full border border-slate-700 object-cover" />
              <div>
                <h4 className="font-bold text-xs truncate max-w-[140px]">{user.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Campus Administrator</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-xs font-bold text-slate-400">
            <button
              onClick={() => setTab('OVERVIEW')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'OVERVIEW' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" /> System Overview
            </button>
            <button
              onClick={() => setTab('STUDENTS')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'STUDENTS' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users className="w-4 h-4" /> Student Registry
            </button>
            <button
              onClick={() => setTab('FACULTY')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'FACULTY' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BookOpen className="w-4 h-4" /> Faculty Roster
            </button>
            <button
              onClick={() => setTab('AUDIT_LOGS')}
              className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center gap-3 transition-colors ${tab === 'AUDIT_LOGS' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Audit Trails
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

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">
        
        {/* TAB 1: OVERVIEW */}
        {tab === 'OVERVIEW' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans font-black">System Statistics</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students Enrolled</span>
                <span className="block text-3xl font-extrabold text-blue-600 mt-2">{metrics.studentsCount}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Faculty Members</span>
                <span className="block text-3xl font-extrabold text-indigo-600 mt-2">{metrics.facultyCount}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Sections Scheduled</span>
                <span className="block text-3xl font-extrabold text-emerald-600 mt-2">{metrics.classesCount}</span>
              </div>
            </div>

            {/* Audit log overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <h2 className="text-lg font-bold text-slate-900 mb-4 uppercase">System Audit logs (Recent)</h2>
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Log User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Resource Target</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {metrics.auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-3 font-bold text-slate-900">{log.userName} ({log.userRole})</td>
                      <td className="py-3 text-slate-500 font-mono">{log.action}</td>
                      <td className="py-3 uppercase tracking-wide">{log.resource}</td>
                      <td className="py-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {tab === 'STUDENTS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Student Registry CRUD</h2>
            
            {/* Create Student form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase">Register New Student</h3>
              <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number (+91...)"
                  value={newStudent.phoneNumber}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Roll Number (e.g. STU1001)"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <select
                  value={newStudent.departmentId}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Add Student Profile
                </button>
              </form>
            </div>

            {/* CSV Import */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Simulate CSV Bulk Registration
              </h3>
              <form onSubmit={handleImportCsv} className="space-y-4">
                <textarea
                  required
                  placeholder="Name,Email,Phone,StudentId"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none h-24 font-mono"
                />
                <button
                  type="submit"
                  disabled={importingCsv}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {importingCsv ? 'Parsing rows...' : 'Import students list'}
                </button>
              </form>
            </div>

            {/* Search and list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Name or Roll No..."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                    className="pl-10 pr-4 w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div className="flex gap-1 text-[10px] font-bold text-slate-500">
                  <button
                    disabled={studentPage === 1}
                    onClick={() => setStudentPage(p => p - 1)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 bg-slate-50 rounded">Page {studentPage} of {totalPages}</span>
                  <button
                    disabled={studentPage >= totalPages}
                    onClick={() => setStudentPage(p => p + 1)}
                    className="px-2.5 py-1.5 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>

              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Roll No</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Class Settings</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="text-slate-700">
                      <td className="py-3 font-mono">{st.studentId}</td>
                      <td className="py-3 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3">{st.department}</td>
                      <td className="py-3">Sem {st.semester} - Sec {st.section}</td>
                      <td className="py-3 text-slate-500">{st.phone}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY */}
        {tab === 'FACULTY' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Faculty Roster</h2>
            
            {/* Create Faculty form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase">Register Faculty Member</h3>
              <form onSubmit={handleCreateFaculty} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={newFaculty.name}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, email: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  value={newFaculty.phoneNumber}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Faculty Code (e.g. FAC1002)"
                  value={newFaculty.facultyId}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, facultyId: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <select
                  value={newFaculty.departmentId}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Designation e.g. Associate Professor"
                  value={newFaculty.designation}
                  onChange={(e) => setNewFaculty(prev => ({ ...prev, designation: e.target.value }))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md md:col-span-3"
                >
                  Add Faculty Profile
                </button>
              </form>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Faculty ID</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Department</th>
                    <th className="pb-3">Designation</th>
                    <th className="pb-3">Phone</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faculty.map((f) => (
                    <tr key={f.id} className="text-slate-700">
                      <td className="py-3 font-mono">{f.facultyId}</td>
                      <td className="py-3 font-bold text-slate-900">{f.name}</td>
                      <td className="py-3">{f.department}</td>
                      <td className="py-3 text-slate-500">{f.designation}</td>
                      <td className="py-3 text-slate-400">{f.phone}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {tab === 'AUDIT_LOGS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Audit Trails</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Log User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Resource Target</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {metrics.auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-3 font-bold text-slate-900">{log.userName} ({log.userRole})</td>
                      <td className="py-3 text-slate-500 font-mono">{log.action}</td>
                      <td className="py-3 uppercase tracking-wide">{log.resource}</td>
                      <td className="py-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
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
