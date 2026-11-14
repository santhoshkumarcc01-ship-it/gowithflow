import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import prisma from '../db';
import * as crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const JWT_SECRET = process.env.SESSION_SECRET || 'campus_secret_key_change_me_in_production';
const COOKIE_NAME = 'ai_campus_session';

export interface UserSessionPayload {
  id: string;
  email: string;
  phoneNumber?: string | null;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  name: string;
  studentId?: string;
  facultyId?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  source: 'supabase' | 'session';
}

export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  // 1. Try Supabase Bearer token if request header is present
  if (req && isSupabaseConfigured) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Learner',
            role: 'STUDENT',
            source: 'supabase'
          };
        }
      } catch {
        // Fall back to session check
      }
    }
  }

  // 2. Try local session cookie
  try {
    const session = await getSession();
    if (session && session.id) {
      return {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        source: 'session'
      };
    }
  } catch {
    // Session read error
  }

  // 3. Fallback: Parse token directly from request cookie header or req.cookies
  if (req) {
    try {
      const cookieVal = req.cookies?.get(COOKIE_NAME)?.value || (req.headers.get('cookie') || '').match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
      if (cookieVal) {
        const payload = verifyToken(cookieVal);
        if (payload && payload.id) {
          return {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            source: 'session'
          };
        }
      }
    } catch {
      // Fallback read error
    }
  }

  return null;
}

export function signToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);
  if (!tokenCookie) return null;

  const payload = verifyToken(tokenCookie.value);
  if (!payload) return null;

  // Verify in PostgreSQL Session table using tokenHash
  const tokenHash = crypto.createHash('sha256').update(tokenCookie.value).digest('hex');
  const session = await prisma.session.findUnique({
    where: { tokenHash }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return payload;
}
