/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  auth,
  isAllowedAuthEmail,
  loginWithEmailPassword,
  loginWithGoogle,
  logout,
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  ArrowRight,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ClassOverview from './components/ClassOverview';
import ClassDetail from './components/ClassDetail';
import { Class } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isAllowedAuthEmail(user.email)) {
        setAuthError('This account is not approved for Gridaan School.');
        setUser(null);
        setLoading(false);
        void logout();
        return;
      }

      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);

    try {
      await loginWithEmailPassword(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Email sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white border border-zinc-200 p-10 rounded-3xl shadow-2xl shadow-zinc-200/50 space-y-8"
        >
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-zinc-200">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gridaan School</h1>
            <p className="text-zinc-500 text-sm">Secure classroom management for approved accounts</p>
          </div>

          {authError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-zinc-200 disabled:opacity-70"
          >
            <ShieldCheck size={18} />
            {isSigningIn ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-300">
            <span className="h-px flex-1 bg-zinc-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <form className="space-y-4" onSubmit={handleEmailSignIn}>
            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base w-full pl-10"
                  placeholder="teacher@example.com"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Password</span>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base w-full pl-10"
                  placeholder="Enter your approved password"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full py-3 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              <ArrowRight size={18} />
              {isSigningIn ? 'Signing in...' : 'Continue with Email'}
            </button>
          </form>

          <p className="text-center text-[11px] text-zinc-400 uppercase tracking-widest font-medium">
            Approved accounts only
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setSelectedClass(null)}
          >
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">Gridaan</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 pr-6 border-r border-zinc-100">
               <div className="text-right">
                 <p className="text-xs font-bold truncate max-w-[120px]">{user.displayName}</p>
                 <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Faculty</p>
               </div>
               <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                 {user.displayName?.split(' ').map(n => n[0]).join('') || 'T'}
               </div>
            </div>
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-zinc-900 p-2 transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <AnimatePresence mode="wait">
          {!selectedClass ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ClassOverview onSelectClass={(cls) => setSelectedClass(cls)} />
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <ClassDetail cls={selectedClass} onBack={() => setSelectedClass(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
