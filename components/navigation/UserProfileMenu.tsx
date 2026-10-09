'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  Key,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Lock,
  Mail
} from 'lucide-react';

export default function UserProfileMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Edit user state
  const [displayName, setDisplayName] = useState('Sampreeth');
  const [displayEmail, setDisplayEmail] = useState('sampreeth@example.com');
  const [editSuccess, setEditSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive dynamic user initials and name from session
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
    if (session?.user?.email) {
      setDisplayEmail(session.user.email);
    }
  }, [session]);

  const getInitials = (name: string) => {
    if (!name) return 'SG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const userInitials = session?.user?.name ? getInitials(session.user.name) : 'SG';
  const userName = session?.user?.name || displayName;
  const userEmail = session?.user?.email || displayEmail;

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    setIsOpen(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
      }
      await signOut({ callbackUrl: '/login' });
    } catch {
      router.push('/login');
    }
  };

  // Handle edit user info save
  const handleSaveUserInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess(true);
    setTimeout(() => {
      setEditSuccess(false);
      setIsEditModalOpen(false);
    }, 1200);
  };

  // Handle password change save
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1200);
  };

  return (
    <div className="relative" ref={menuRef}>
      
      {/* 1. THE TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
        className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl cursor-pointer transition select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        {/* Avatar Element: Rounded-square blue badge */}
        <div className="bg-blue-600 text-white rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
          {userInitials}
        </div>

        {/* Name Element: Styled in white/light-gray or dark text */}
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
          {userName}
        </span>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 2. THE DROPDOWN MENU (FLOATING CANVAS) */}
      {isOpen && (
        <div 
          className="absolute right-0 top-12 w-60 bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] rounded-xl shadow-2xl z-50 overflow-hidden animate-scaleIn transition-all"
        >
          {/* User Details Header in Dropdown */}
          <div className="p-3.5 border-b border-slate-100 dark:border-[#2d2f31] bg-slate-50/70 dark:bg-[#18191a]">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white rounded-lg w-9 h-9 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[#8e918f] truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Student &bull; Researcher
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>

          {/* 3. DROPDOWN MENU ITEMS */}
          <div className="py-1">
            
            {/* Item 1: Edit User Info */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsEditModalOpen(true);
              }}
              className="w-full text-left p-3 flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282a2c] cursor-pointer transition-colors"
            >
              <User className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">Edit User Info</span>
                <span className="text-[10px] text-slate-400 block">Name, contact & profile details</span>
              </div>
            </button>

            {/* Item 2: Change Password */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPasswordModalOpen(true);
              }}
              className="w-full text-left p-3 flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282a2c] cursor-pointer transition-colors"
            >
              <Key className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium block">Change Password</span>
                <span className="text-[10px] text-slate-400 block">Security credentials & passkeys</span>
              </div>
            </button>

            {/* Divider */}
            <div className="border-b border-slate-100 dark:border-[#2d2f31] my-1" />

            {/* Item 3: Log Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left p-3 flex items-center gap-3 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold block">Log Out</span>
                <span className="text-[10px] text-red-400/80 block">End current session securely</span>
              </div>
            </button>

          </div>
        </div>
      )}

      {/* EDIT USER INFO MODAL */}
      {mounted && isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4 animate-scaleIn text-slate-800 dark:text-[#e3e3e3]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                <span>Edit User Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Profile info updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveUserInfo} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={displayEmail}
                    onChange={(e) => setDisplayEmail(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2d2f31]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#444746] hover:bg-slate-100 dark:hover:bg-[#282a2c] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* CHANGE PASSWORD MODAL */}
      {mounted && isPasswordModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-4 animate-scaleIn text-slate-800 dark:text-[#e3e3e3]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            {passwordSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold">
                <Check className="w-4 h-4" />
                <span>Password changed successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSavePassword} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2d2f31]">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-[#444746] hover:bg-slate-100 dark:hover:bg-[#282a2c] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
