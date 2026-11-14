import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Calendar } from 'lucide-react';
import prisma from '@/lib/db';

export const revalidate = 0; // Disable caching for real-time updates

export default async function UpdatesPage() {
  const announcements = await prisma.announcement.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: true },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold mb-8 hover:-translate-x-1 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-blue-600" />
          Campus Bulletin Board
        </h1>
        <p className="text-lg text-slate-600 mb-12">
          Latest official notices, exam timetables, and academic bulletins.
        </p>

        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No bulletins published recently.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    a.priority === 'HIGH' || a.priority === 'URGENT'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {a.priority} Priority
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(a.publishedAt).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{a.content}</p>
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Author: {a.author.name}</span>
                  <span className="uppercase tracking-wider">{a.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
