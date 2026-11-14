'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowLeft, Layers, UserCheck, FolderUp, GraduationCap } from 'lucide-react';

export default function FacultyLanding() {
  const highlights = [
    { title: 'Take Attendance in Seconds', desc: 'Roll lists auto-load for designated sections. Instantly save logs with automatic status badges.', icon: UserCheck },
    { title: 'Publish Study Notes & Labs', desc: 'Upload documents, reference links, and lab guides directly from your device.', icon: FolderUp },
    { title: 'Submit Grade Books', desc: 'Grade submissions with quick sliders, type feedback, and notify student targets instantly.', icon: GraduationCap },
    { title: 'Risk Indicators Charts', desc: 'Automatically highlight students with attendance under 75% for early guidance.', icon: Layers }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold mb-8 hover:-translate-x-1 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          For <span className="text-blue-600">Faculty & Staff</span>
        </h1>
        <p className="text-lg text-slate-600 mb-12">
          Minimize admin tasks and focus on coaching. Mark roll sheets and grade papers easily.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{h.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link href="/login" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10">
            Staff Portal Login
          </Link>
        </div>
      </div>
    </div>
  );
}
