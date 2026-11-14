'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type AuthStep = 'EMAIL_ENTRY' | 'OTP_ENTRY';

export default function LoginPage() {
  const router = useRouter();
  const [authStep, setAuthStep] = useState<AuthStep>('EMAIL_ENTRY');
  
  // Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [challengeId, setChallengeId] = useState('');
  const [showRegisterName, setShowRegisterName] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for individual OTP digits
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === 'OTP_ENTRY' && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [authStep, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your student email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: cleanEmail,
          name: showRegisterName ? name.trim() : undefined,
          role: 'STUDENT'
        })
      });

      const json = await res.json();

      if (!json.success) {
        if (json.error?.code === 'USER_NOT_REGISTERED') {
          setShowRegisterName(true);
          setErrorMessage(json.error?.message || 'New student? Enter your full name to get started.');
        } else {
          setErrorMessage(json.error?.message || 'Could not send verification code. Please try again.');
        }
      } else {
        setChallengeId(json.data.challengeId);
        setAuthStep('OTP_ENTRY');
        setCountdown(30);
        setOtp(Array(6).fill(''));
        setShowRegisterName(false);
        setInfoMessage(`We sent a 6-digit verification code to ${cleanEmail}`);
        
        // Focus first OTP input on next tick
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch {
      setErrorMessage('Unable to reach authentication server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const fullOtp = otp.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, otp: fullOtp })
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error?.message || 'Incorrect verification code. Please try again.');
      } else {
        // Authenticated! Direct redirect to student dashboard
        router.push('/student/dashboard');
      }
    } catch {
      setErrorMessage('OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP inputs key navigation and handling
  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    
    const newOtp = [...otp];
    text.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(text.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="min-h-screen bg-black text-[#E1E0CC] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative selection:bg-[#DEDBC8] selection:text-black">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(222,219,200,0.06),transparent_70%)] pointer-events-none" />

      {/* Top Bar with Back Link */}
      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#E1E0CC]/70 hover:text-[#E1E0CC] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <span className="text-[11px] uppercase tracking-widest text-[#DEDBC8]/60 font-mono">
          GoWithFlow Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md bg-[#111111] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DEDBC8]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#DEDBC8]/20 to-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#DEDBC8] shadow-inner">
              <Sparkles className="w-6 h-6 text-[#DEDBC8]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E1E0CC]">
              {authStep === 'EMAIL_ENTRY' ? "Welcome Back. Let's Keep Moving Forward." : 'Enter Verification Code'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              {authStep === 'EMAIL_ENTRY' 
                ? 'Sign in to continue your personalized learning journey and explore your career insights.' 
                : (infoMessage || 'A 6-digit one-time code has been sent via SMTP to your email.')}
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs font-medium flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Email Entry */}
          {authStep === 'EMAIL_ENTRY' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#DEDBC8]/70 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="learner@gowithflow.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-[#181818] border border-neutral-800 focus:border-[#DEDBC8] rounded-xl text-sm text-[#E1E0CC] placeholder-gray-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* If newly registering learner */}
              {showRegisterName && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#DEDBC8]/70 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#181818] border border-neutral-800 focus:border-[#DEDBC8] rounded-xl text-sm text-[#E1E0CC] placeholder-gray-600 focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#DEDBC8] hover:bg-[#DEDBC8]/90 text-black font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching Code via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <span>{showRegisterName ? 'Create My Account' : 'Sign In with Email'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#DEDBC8]/70" />
                  <span>Secure 6-digit verification code delivered directly to your inbox.</span>
                </p>
              </div>
            </form>
          ) : (
            /* Step 2: OTP Entry */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex items-center justify-between">
                <button 
                  type="button" 
                  onClick={() => {
                    setAuthStep('EMAIL_ENTRY');
                    setErrorMessage('');
                  }}
                  className="text-xs text-gray-400 hover:text-[#DEDBC8] transition-colors flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change email</span>
                </button>
                <span className="text-[11px] font-mono text-gray-400 truncate max-w-[180px]">
                  {email}
                </span>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between gap-2 sm:gap-2.5">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    required
                    pattern="[0-9]"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl font-bold bg-[#181818] border border-neutral-800 rounded-xl focus:border-[#DEDBC8] focus:outline-none text-[#E1E0CC] transition-colors"
                  />
                ))}
              </div>

              {/* Resend status & action */}
              <div className="flex items-center justify-between text-xs font-medium pt-1">
                <span className="text-gray-500">
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Didn’t get the code?'}
                </span>
                <button
                  type="button"
                  disabled={!canResend || loading}
                  onClick={handleSendOtp}
                  className="text-[#DEDBC8] hover:underline disabled:opacity-40 disabled:hover:no-underline font-semibold"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full py-3.5 bg-[#DEDBC8] hover:bg-[#DEDBC8]/90 text-black font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Access Dashboard</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full text-center pb-2">
        <p className="text-[11px] text-gray-600">
          GoWithFlow &bull; Find Your Direction. Grow With Flow.
        </p>
      </footer>
    </div>
  );
}
