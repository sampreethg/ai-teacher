'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User,
  Key,
  Shield,
  ArrowLeft,
  Check,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  Clock,
  BookOpen,
  Award
} from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';
import UserProfileMenu from '@/components/navigation/UserProfileMenu';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'security' ? 'security' : 'edit';

  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'edit' | 'security'>(initialTab);

  // Edit user state
  const [name, setName] = useState(session?.user?.name || 'Sampreeth');
  const [email, setEmail] = useState(session?.user?.email || 'sampreeth@example.com');
  const [bio, setBio] = useState('Passionate learner researching computer systems and AI architectures.');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#131722]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">User Settings</span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserProfileMenu />
        </div>
      </header>

      {/* Profile Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Profile Card Header */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white rounded-2xl w-16 h-16 flex items-center justify-center font-bold text-2xl shadow-md">
              SG
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Verified Student
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{email}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-500" /> 8 Lessons Created</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> 94% Socratic Mastery</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/studio"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Resume Studio
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Edit User Info</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Change Password & Security</span>
          </button>
        </div>

        {/* Tab 1: Edit User Info */}
        {activeTab === 'edit' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your public profile display name and contact credentials.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Profile details saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                  Academic Focus & Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Change Password & Security */}
        {activeTab === 'security' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Security & Passkey Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Change your account password and review active authentication methods.
              </p>
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-lg">
              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131722] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
