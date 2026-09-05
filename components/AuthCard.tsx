'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Github,
  Linkedin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from 'next-themes';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  agreeTerms: boolean;
}

interface AuthCardProps {
  initialMode?: 'login' | 'register';
}

export default function AuthCard({ initialMode = 'login' }: AuthCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [loginForm, setLoginForm] = useState<LoginFormValues>({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormValues>({
    name: '',
    email: '',
    password: '',
    agreeTerms: false,
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowPassword(false);
    // update URL without full reload
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newMode === 'login' ? '/login' : '/register');
    }
  };

  // Validation
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Sign In Handler
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginForm.email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(loginForm.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!loginForm.password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (loginForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Ready to hook into NextAuth:
      // const res = await signIn('credentials', { redirect: false, email: loginForm.email, password: loginForm.password });
      await new Promise((resolve) => setTimeout(resolve, 900));

      setSuccessMessage('Welcome back! Redirecting to your AI Classroom Dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1100);
    } catch {
      setErrorMessage('Invalid credentials or network issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register Handler
  const handleCredentialsRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!registerForm.name.trim()) {
      setErrorMessage('Please enter your full name or username.');
      return;
    }
    if (!registerForm.email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(registerForm.email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!registerForm.password) {
      setErrorMessage('Please create a password.');
      return;
    }
    if (registerForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!registerForm.agreeTerms) {
      setErrorMessage('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      // Ready to hook into NextAuth or registration endpoint:
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccessMessage('Account created successfully! Preparing your learning environment...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1100);
    } catch {
      setErrorMessage('Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth Handler (Ready for NextAuth signIn)
  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'linkedin') => {
    setErrorMessage(null);
    setLoadingProvider(provider);
    try {
      // Hook ready for NextAuth:
      // await signIn(provider, { callbackUrl: '/dashboard' });
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMessage(`Authenticating with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch {
      setErrorMessage(`Failed to connect with ${provider}. Please try again.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Background Accent Glows */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 blur-[130px] rounded-full pointer-events-none ${
        isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-400/15'
      }`} />
      <div className={`absolute bottom-10 right-10 w-72 h-72 blur-[140px] rounded-full pointer-events-none ${
        isDarkMode ? 'bg-blue-600/10' : 'bg-blue-400/10'
      }`} />

      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center max-w-7xl mx-auto z-20">
        <Link 
          href="/" 
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <ThemeToggle />
      </div>

      {/* Main Centered Auth Card Container */}
      <div className="w-full max-w-md my-8 z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              AI Teacher
            </span>
          </Link>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Human-Like AI Educator &bull; Socratic Learning Platform
          </p>
        </div>

        {/* Card Box */}
        <div className={`p-7 sm:p-8 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${
          isDarkMode 
            ? 'border-slate-800 bg-slate-900/85 shadow-cyan-500/5' 
            : 'border-slate-200 bg-white/95 shadow-xl'
        }`}>

          {/* Mode Switcher Tabs */}
          <div className={`grid grid-cols-2 p-1 rounded-xl mb-6 border ${
            isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? isDarkMode 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? isDarkMode 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' 
                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Visual Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Visual Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN (LOGIN) */}
          {mode === 'login' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              
              {/* Email */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="student@example.com"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-xs font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs text-cyan-500 hover:text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••••••"
                    className={`w-full rounded-xl py-3 pl-10 pr-11 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                      isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className={`text-xs select-none cursor-pointer ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Keep me signed in on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in to Classroom...</span>
                  </>
                ) : (
                  <span>Sign In to Classroom &rarr;</span>
                )}
              </button>

            </form>
          )}

          {/* VIEW 2: CREATE ACCOUNT (REGISTER) */}
          {mode === 'register' && (
            <form onSubmit={handleCredentialsRegister} className="space-y-4">
              
              {/* Name */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Full Name or Username
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="John Doe"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="student@example.com"
                    className={`w-full rounded-xl py-3 pl-10 pr-4 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Create a strong password"
                    className={`w-full rounded-xl py-3 pl-10 pr-11 border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-950/70 border-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                      isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms of Service Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={registerForm.agreeTerms}
                  onChange={(e) => setRegisterForm({ ...registerForm, agreeTerms: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 mt-1 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className={`text-xs select-none cursor-pointer leading-tight ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  I agree to the{' '}
                  <a href="#" className="text-cyan-500 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-cyan-500 hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Free Account...</span>
                  </>
                ) : (
                  <span>Create Free Account &rarr;</span>
                )}
              </button>

            </form>
          )}

          {/* SOCIAL OAUTH PROVIDERS DIVIDER */}
          <div className="relative my-6 text-center">
            <div className={`absolute inset-0 flex items-center ${isDarkMode ? 'opacity-25' : 'opacity-40'}`}>
              <div className={`w-full border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`} />
            </div>
            <span className={`relative px-3 text-[11px] font-semibold uppercase tracking-wider ${
              isDarkMode ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-500'
            }`}>
              {mode === 'login' ? 'Or continue with' : 'Or sign up with'}
            </span>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loadingProvider !== null}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-700/80 text-slate-200 hover:border-cyan-500 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
              }`}
              title="Continue with Google"
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.7 0 3 .7 3.9 1.6l2.9-2.9C17 2 14.7 1.2 12 1.2 7.5 1.2 3.7 3.8 1.9 7.5l3.5 2.7C6.3 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.4 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.5C.7 8.9 0 10.4 0 12s.7 3.1 1.9 5.5l3.5-2.7z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2.3-6.6-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
              )}
              <span className="hidden sm:inline">Google</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loadingProvider !== null}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-700/80 text-slate-200 hover:border-cyan-500 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
              }`}
              title="Continue with GitHub"
            >
              {loadingProvider === 'github' ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              ) : (
                <Github className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden sm:inline">GitHub</span>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => handleOAuthSignIn('linkedin')}
              disabled={loadingProvider !== null}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                isDarkMode 
                  ? 'bg-slate-950/70 border-slate-700/80 text-slate-200 hover:border-cyan-500 hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
              }`}
              title="Continue with LinkedIn"
            >
              {loadingProvider === 'linkedin' ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
              ) : (
                <Linkedin className="w-4 h-4 shrink-0 text-[#0A66C2]" />
              )}
              <span className="hidden sm:inline">LinkedIn</span>
            </button>

          </div>

          {/* Footer Link (Toggle Mode) */}
          <div className="mt-6 text-center pt-4 border-t border-slate-800/60">
            {mode === 'login' ? (
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-cyan-500 font-bold hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-cyan-500 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold mb-1">Reset Your Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered student email and we&apos;ll send you a password recovery link.
            </p>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password reset instructions sent to <strong>{forgotEmail}</strong>.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordOpen(false);
                    setForgotSent(false);
                    setForgotEmail('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@example.com"
                  className={`w-full rounded-xl py-2.5 px-3 border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md hover:from-cyan-400 hover:to-blue-500 transition-all"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
