import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import prisma from '@/lib/db';

export const revalidate = 0;

export default async function PublicEventsPage() {
  const events = await prisma.event.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { startDateTime: 'asc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold mb-8 hover:-translate-x-1 transition-transform">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Campus Events & Hackathons
        </h1>
        <p className="text-lg text-slate-600 mb-12">
          Discover workshops, webinars, and cultural activities. Log in to register.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              No upcoming events listed. Check back later!
            </div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="bg-slate-900 aspect-video w-full flex items-center justify-center text-slate-500 font-bold relative">
                  {e.bannerUrl ? (
                    <img src={e.bannerUrl} alt={e.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>No Image Available</span>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
                    {e.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{e.title}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">{e.description}</p>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>Starts: {new Date(e.startDateTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span>Venue: {e.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>Capacity: {e.capacity} seats</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-2">
                    <Link
                      href="/login"
                      className="block text-center w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Login to Register
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
