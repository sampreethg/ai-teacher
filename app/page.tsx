'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Play,
  Sparkles,
  Zap,
  Sliders,
  Video,
  Brain,
  FileText,
  Clock,
  Globe,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  MessageSquareCode,
  LineChart,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

type TabType = 'problem' | 'solution';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('solution');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className={`min-h-screen transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden ${
      isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Background Accent Lights */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0 ${
        isDarkMode ? 'bg-hero-gradient' : 'bg-gradient-to-b from-cyan-50/60 via-blue-50/30 to-transparent'
      }`} />
      <div className={`absolute top-96 left-[-10%] w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none ${
        isDarkMode ? 'bg-cyan-500/5' : 'bg-cyan-400/10'
      }`} />
      <div className={`absolute top-[1400px] right-[-10%] w-[600px] h-[600px] blur-[180px] rounded-full pointer-events-none ${
        isDarkMode ? 'bg-blue-600/5' : 'bg-blue-400/10'
      }`} />

      {/* 1. GLOBAL NAVIGATION BAR */}
      <nav className={`sticky top-0 z-50 glass-panel border-b backdrop-blur-xl transition-colors duration-300 ${
        isDarkMode ? 'border-slate-800/80 bg-slate-950/70' : 'border-slate-200/80 bg-white/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo / Project Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all duration-300">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-extrabold tracking-tight flex items-center gap-1.5 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                AI Teacher
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </span>
              <span className={`text-[10px] uppercase font-semibold tracking-wider ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>Next-Gen Educator</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className={`text-sm font-medium transition-colors ${
              isDarkMode ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
            }`}>Why Us</a>
            <a href="#how-it-works" className={`text-sm font-medium transition-colors ${
              isDarkMode ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
            }`}>How It Works</a>
            <a href="#demo" className={`text-sm font-medium transition-colors ${
              isDarkMode ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
            }`}>Instant Demo</a>
            <a href="#features" className={`text-sm font-medium transition-colors ${
              isDarkMode ? 'text-slate-300 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
            }`}>Features</a>
          </div>

          {/* Right Action Links + Color Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Color Theme Toggle Button */}
            <ThemeToggle />

            <Link 
              href="/login" 
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/50' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Login
            </Link>
            <Link 
              href="/login" 
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Register</span>
            </Link>
          </div>

          {/* Mobile menu trigger + theme toggle button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-slate-800/60 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 hover:text-black'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`md:hidden glass-panel border-b px-4 pt-4 pb-6 space-y-3 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200 bg-white/95'
          }`}>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              Why Us
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              How It Works
            </a>
            <a 
              href="#demo" 
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              Instant Demo
            </a>
            <div className={`pt-4 border-t flex flex-col gap-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <Link 
                href="/login" 
                className={`w-full text-center py-2.5 rounded-lg border font-semibold text-sm ${
                  isDarkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'
                }`}
              >
                Login
              </Link>
              <Link 
                href="/login" 
                className="w-full text-center py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-md"
              >
                Register Free Account
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <header className="relative pt-12 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        
        {/* Top Badge */}
        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border text-xs font-semibold shadow-inner ${
            isDarkMode 
              ? 'border-cyan-500/30 text-cyan-300' 
              : 'border-cyan-500/40 text-cyan-700 bg-cyan-50/80'
          }`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span>AI Teacher 2.0 Engine &bull; Multi-Agent Video Classroom</span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
          </div>
        </div>

        {/* Headline & Sub-headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Learn Anything Faster with a{' '}
            <span className="text-gradient">Human-Like AI Educator</span>
          </h1>
          
          <p className={`text-lg sm:text-xl font-normal leading-relaxed max-w-3xl mx-auto ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            This isn’t just another text chatbot. Experience an interactive, video-based AI teacher 
            that dynamically adapts to your exact learning level, time constraint, and native language.
          </p>

          {/* Centered One-Time Tier CTA Button Section */}
          <div id="demo" className="pt-6 pb-2 flex flex-col items-center justify-center text-center scroll-mt-28">
            <Link
              id="join-class-button"
              href="/classroom?demo=true"
              className="group relative inline-flex items-center justify-center gap-3.5 px-8 py-4 sm:px-10 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-cyan-500/25 glow-btn hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
              <span className="tracking-tight">Join Class &bull; Instant Demo</span>
              <ArrowRight className="w-5 h-5 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Subtext Below Button */}
            <p className={`text-xs sm:text-sm mt-3.5 font-medium tracking-wide flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>No login or credit card required &bull; Instant 1-click session</span>
            </p>

            {/* Secondary Account Link */}
            <div className="pt-3">
              <Link
                href="/login"
                className={`text-xs font-semibold hover:underline transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-600 hover:text-cyan-600'
                }`}
              >
                Want to save progress? Create a free account or sign in &rarr;
              </Link>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className={`pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>Socratic Misconception Detection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-500" />
              <span>Flexible 5-to-60 Min Sessions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-500" />
              <span>50+ Supported Languages</span>
            </div>
          </div>
        </div>

      </header>

      {/* 3. ABOUT US / THE SOLUTION SECTION */}
      <section id="about" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 scroll-mt-28">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Why We Built AI Teacher</h2>
          <p className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Traditional AI Chatbots Don’t Teach.{' '}
            <span className="text-gradient">They Just Output Text Walls.</span>
          </p>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            We realized that students don&apos;t learn by scrolling through static PDFs or reading 500-word ChatGPT essays. True comprehension requires active teaching, dynamic visuals, and real-time dialogue.
          </p>
        </div>

        {/* Tab Toggle for Problem vs Solution */}
        <div className="flex justify-center mb-10">
          <div className={`glass-panel p-1.5 rounded-xl border flex gap-2 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200 bg-white/80 shadow-sm'
          }`}>
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'problem'
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 shadow-sm'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              The Problem (Chatbots &amp; PDFs)
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'solution'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              The AI Teacher Solution
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Card 1: The Problem */}
          <div className={`glass-card p-8 rounded-2xl border transition-all ${
            activeTab === 'problem' 
              ? isDarkMode ? 'border-red-500/50 bg-slate-900/80 shadow-2xl' : 'border-red-400 bg-white shadow-xl'
              : isDarkMode ? 'border-slate-800 opacity-75' : 'border-slate-200 opacity-80'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              The Static Chatbot Dilemma
            </h3>
            <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              When given complex topics, generic LLMs generate dense text walls. They cannot gauge whether you truly understand or are just nodding along.
            </p>
            <ul className={`space-y-3.5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Passive Text Output:</strong> Boring text dumps without audio or visual step-by-step canvas breakdowns.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>No Constraint Awareness:</strong> Fails to fit explanations into your available 15-minute study window.</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span><strong>Silent Misconceptions:</strong> Doesn&apos;t probe your understanding with targeted Socratic questions.</span>
              </li>
            </ul>
          </div>

          {/* Card 2: The Solution */}
          <div className={`glass-card p-8 rounded-2xl border transition-all ${
            activeTab === 'solution' 
              ? isDarkMode ? 'border-cyan-500/60 bg-slate-900/90 shadow-2xl shadow-cyan-500/10' : 'border-cyan-400 bg-white shadow-xl'
              : isDarkMode ? 'border-slate-800 opacity-75' : 'border-slate-200 opacity-80'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              The Multi-Agent AI Educator Pipeline
            </h3>
            <p className={`text-sm leading-relaxed mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              AI Teacher ingests your textbooks or topic queries, builds a structured pedagogical plan, and delivers synchronized voice &amp; visual classes with active Socratic testing.
            </p>
            <ul className={`space-y-3.5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span><strong>Multi-Agent Pipeline:</strong> Syllabus Planner, Visual Canvas Engine, and Socratic Evaluator working together.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span><strong>Synchronized Voice &amp; Canvas:</strong> Real-time audio explanations timed precisely with dynamic math formulas and code visuals.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span><strong>Diagnostic Mastery Reports:</strong> Pinpoints exact conceptual gaps so you master subjects in half the time.</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* 4. HOW IT WORKS (STEP-BY-STEP WORKFLOW) */}
      <section id="how-it-works" className={`py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 rounded-3xl border my-8 transition-colors scroll-mt-28 ${
        isDarkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-100/70 border-slate-200/80 shadow-sm'
      }`}>
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Step-by-Step Workflow</h2>
          <p className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            How AI Teacher Transforms Your Learning
          </p>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            From raw textbooks to deep conceptual mastery in four simple, automated steps.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="glass-card p-6 rounded-2xl border relative flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <span className={`text-3xl font-extrabold font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>01</span>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Step 1: Upload or Ask</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Upload a 500-page textbook PDF or type any topic like &quot;Newton&apos;s Laws&quot; or &quot;Quantum Tunneling&quot;.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/40 text-[11px] text-cyan-500 font-semibold flex items-center gap-1">
              <span>Ingests PDFs &amp; Topics</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-6 rounded-2xl border relative flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Sliders className="w-6 h-6" />
                </div>
                <span className={`text-3xl font-extrabold font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>02</span>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Step 2: Set Constraints</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Choose your available timeframe (e.g. 15 mins), difficulty level (Beginner to PhD), and preferred native language.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/40 text-[11px] text-blue-500 font-semibold flex items-center gap-1">
              <span>Personalized Syllabus</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-6 rounded-2xl border relative flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-500 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                  <Video className="w-6 h-6" />
                </div>
                <span className={`text-3xl font-extrabold font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>03</span>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Step 3: Attend the Class</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Watch and listen as the AI Avatar explains concepts with real-time math equations, code execution, and visual diagrams.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/40 text-[11px] text-violet-500 font-semibold flex items-center gap-1">
              <span>Interactive AI Classroom</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass-card p-6 rounded-2xl border relative flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Brain className="w-6 h-6" />
                </div>
                <span className={`text-3xl font-extrabold font-mono ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`}>04</span>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Step 4: Socratic Evaluation</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Answer checkpoint diagnostic questions to detect hidden misconceptions and receive your personalized mastery report.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/40 text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              <span>Diagnostic Mastery Report</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

        </div>

      </section>

      {/* 5. KEY FEATURES HIGHLIGHT GRID */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 scroll-mt-28">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Built for Deep Learning</h2>
          <p className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Engineered Like a World-Class Professor
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-card p-8 rounded-2xl border space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <MessageSquareCode className="w-6 h-6" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Socratic Dialogue Engine</h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Instead of lecturing passively, the AI asks targeted counter-questions when you give an ambiguous answer, diagnosing your exact misconception.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Instant Diagnostic Mastery</h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Get an instant radar breakdown of your topic strength, retained knowledge percentage, and tailored revision schedules.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl border space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-500">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Multilingual &amp; Adaptive Pace</h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Learn physics in Spanish, machine learning in Japanese, or calculus in English. Set strict 10-minute micro-lessons or 60-minute deep dives.
            </p>
          </div>

        </div>

      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className={`glass-panel p-8 sm:p-12 md:p-16 rounded-3xl border text-center relative overflow-hidden shadow-2xl ${
          isDarkMode 
            ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40' 
            : 'border-cyan-300/60 bg-gradient-to-r from-cyan-100/70 via-white to-blue-100/70 shadow-lg'
        }`}>
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to Experience the Future of Education?
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Test out our Instant Demo for free or create an account to upload your own textbook PDFs today.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/classroom?demo=true" 
                className="glow-btn px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xl hover:from-cyan-400 hover:to-blue-500"
              >
                Try Instant Demo Now
              </Link>
              <Link 
                href="/login" 
                className={`px-8 py-4 rounded-xl glass-card border font-semibold text-base transition-all ${
                  isDarkMode 
                    ? 'border-slate-700 text-slate-100 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GLOBAL FOOTER */}
      <footer className={`border-t py-12 px-4 sm:px-6 lg:px-8 relative z-10 transition-colors ${
        isDarkMode ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200/80 bg-slate-100/90'
      }`}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Teacher</span>
            </Link>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Human-like AI Educator delivering video lessons, real-time math canvases, and Socratic evaluations.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Product</h4>
            <ul className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li><a href="#how-it-works" className="hover:text-cyan-500 transition-colors">How It Works</a></li>
              <li><Link href="/classroom?demo=true" className="hover:text-cyan-500 transition-colors">Instant Demo</Link></li>
              <li><a href="#features" className="hover:text-cyan-500 transition-colors">Features</a></li>
              <li><Link href="/classroom?demo=true" className="hover:text-cyan-500 transition-colors">One-Time Demo Tier</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Account</h4>
            <ul className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li><Link href="/login" className="hover:text-cyan-500 transition-colors">Student Login</Link></li>
              <li><Link href="/login" className="hover:text-cyan-500 transition-colors">Register Account</Link></li>
              <li><Link href="/login" className="hover:text-cyan-500 transition-colors">Upload Textbooks</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="space-y-3">
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Technology</h4>
            <ul className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <li><span className="text-slate-500 dark:text-slate-400">Multi-Agent Pipeline</span></li>
              <li><span className="text-slate-500 dark:text-slate-400">Synchronized Audio-Canvas</span></li>
              <li><span className="text-slate-500 dark:text-slate-400">Socratic Evaluator</span></li>
              <li><span className="text-slate-500 dark:text-slate-400">Next.js 14 &amp; React</span></li>
            </ul>
          </div>

        </div>

        <div className={`max-w-7xl mx-auto pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-4 ${
          isDarkMode ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-600'
        }`}>
          <p>&copy; {new Date().getFullYear()} AI Teacher Project. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cyan-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cyan-500 transition-colors">Security</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
