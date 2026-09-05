'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Bell,
  Sparkles,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Clock,
  Layers,
  FolderPlus,
  CheckCircle2,
  Trash2,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';
import UserProfileMenu from '@/components/navigation/UserProfileMenu';

interface Lesson {
  id: string;
  title: string;
  emoji: string;
  category: string;
  dateCreated: string;
  sourceCount: number;
  progress?: number;
  description?: string;
}

const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'auth-portal',
    title: 'The Google Account Authentication Portal',
    emoji: '🔑',
    category: 'Security & Auth',
    dateCreated: '26 Mar 2026',
    sourceCount: 25,
    progress: 92,
    description: 'OAuth 2.0 PKCE, OpenID Connect & FIDO2 passkey architectures'
  },
  {
    id: 'os-java',
    title: 'Operating Systems and Java',
    emoji: '☕',
    category: 'Computer Science',
    dateCreated: '24 Mar 2026',
    sourceCount: 18,
    progress: 78,
    description: 'Kernel context switching, virtual threads and JVM memory models'
  },
  {
    id: 'knowledge-ai',
    title: 'Knowledge-Aware AI',
    emoji: '🧠',
    category: 'AI & ML',
    dateCreated: '22 Mar 2026',
    sourceCount: 14,
    progress: 85,
    description: 'Grounded vector RAG, knowledge graphs and hallucination reduction'
  },
  {
    id: 'karmaskill',
    title: 'KarmaSkill AI Research',
    emoji: '🚀',
    category: 'AI Agents',
    dateCreated: '20 Mar 2026',
    sourceCount: 31,
    progress: 96,
    description: 'Multi-agent orchestration and reinforcement learning checkpoints'
  },
  {
    id: 'newtonian',
    title: 'Newtonian Dynamics',
    emoji: '📖',
    category: 'Physics',
    dateCreated: '18 Mar 2026',
    sourceCount: 12,
    progress: 64,
    description: 'Classical mechanics, differential equations of motion and friction'
  },
  {
    id: 'distributed-systems',
    title: 'Distributed Consensus & Raft Protocols',
    emoji: '🌐',
    category: 'Distributed Systems',
    dateCreated: '15 Mar 2026',
    sourceCount: 9,
    progress: 50,
    description: 'Leader election, log replication and Byzantine fault tolerance'
  },
  {
    id: 'biochem-metabolism',
    title: 'Cellular Respiration & Krebs Cycle',
    emoji: '🎓',
    category: 'Biochemistry',
    dateCreated: '12 Mar 2026',
    sourceCount: 16,
    progress: 70,
    description: 'ATP synthesis, electron transport chain and metabolic regulation'
  },
  {
    id: 'quantum-computing',
    title: 'Quantum Gates and Shor’s Algorithm',
    emoji: '⚛️',
    category: 'Quantum Computing',
    dateCreated: '08 Mar 2026',
    sourceCount: 22,
    progress: 88,
    description: 'Qubits, quantum entanglement and cryptographic implications'
  }
];

export default function DashboardLessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const categories = ['All', 'Security & Auth', 'Computer Science', 'AI & ML', 'Physics', 'Biochemistry'];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'All' || lesson.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLessons(prev => prev.filter(l => l.id !== id));
    setOpenMenuId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#131722]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors">
        
        {/* Left: Platform Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
                AI Teacher Studio
              </span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                Studio Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons, concepts, or topics..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Global ThemeToggle, Notifications Icon, and User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Global ThemeToggle Component */}
          <ThemeToggle />

          {/* Notifications Icon with Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a202c] dark:hover:bg-[#252d3d] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#131722]" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 shadow-xl p-3 z-40 animate-scaleIn text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-white">Recent Activity</span>
                  <span className="text-[10px] text-blue-500 font-semibold cursor-pointer">Mark read</span>
                </div>
                <div className="py-2 space-y-2">
                  <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Fast Research Completed</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">5 sources in &ldquo;Google Auth Portal&rdquo; ingested and indexed.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-800 dark:text-white">Socratic Checkpoint Passed</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Scored 94% on OAuth 2.0 PKCE Diagnostic.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <UserProfileMenu />

        </div>

      </header>

      {/* 2. SUB-HEADER / CATEGORY FILTER BAR */}
      <section className="px-4 sm:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Recent Lessons</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLessons.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select a lesson to resume AI Studio research or launch an interactive visual lecture.
            </p>
          </div>

          {/* Quick Launch CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Open Studio</span>
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 3. LESSONS GALLERY GRID */}
      <main className="flex-1 p-4 sm:p-8 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* CARD 1 — PRIMARY ACTION: "+ Create new lesson" */}
          <Link
            href="/studio"
            className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all min-h-[180px] bg-slate-100/60 dark:bg-[#131722]/50 hover:bg-blue-50/50 dark:hover:bg-slate-800/40 group shadow-xs hover:shadow-md text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all flex items-center justify-center mb-3 shadow-xs">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Create new lesson
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ingest Books, PDFs & Notes
            </span>
          </Link>

          {/* DYNAMIC LESSON CARDS */}
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => router.push(`/studio?id=${lesson.id}`)}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#161b26] p-5 flex flex-col justify-between hover:border-blue-500/80 dark:hover:border-blue-500/80 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer min-h-[180px]"
            >
              
              {/* Top Row: Subject icon / 3D emoji badge + Three-dot options menu */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1e2536] border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform">
                  <span>{lesson.emoji}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setOpenMenuId(openMenuId === lesson.id ? null : lesson.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === lesson.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-30 animate-scaleIn text-xs"
                    >
                      <button
                        onClick={() => router.push(`/studio?id=${lesson.id}`)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>Open Studio</span>
                      </button>
                      <button
                        onClick={() => router.push('/classroom')}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Video Lesson</span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: Lesson Title (2-line clamp, bold text) */}
              <div className="my-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {lesson.title}
                </h3>
                {lesson.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                    {lesson.description}
                  </p>
                )}
              </div>

              {/* Bottom Metadata: Date created + Source count pill */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{lesson.dateCreated}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1f2738] text-slate-700 dark:text-blue-300 font-semibold border border-slate-200 dark:border-slate-700/50">
                  {lesson.sourceCount} sources
                </span>
              </div>

            </div>
          ))}

        </div>

        {/* Empty State if filter yields no results */}
        {filteredLessons.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#131722]/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 mt-4">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching lessons found</p>
            <p className="text-xs text-slate-500 mt-1">Try refining your search query or select &ldquo;All&rdquo; categories.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-4 px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </main>

      {/* 4. FOOTER NOTE */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-4 text-center text-xs text-slate-500 dark:text-slate-500">
        AI Teacher Studio &bull; Grounded in uploaded educational materials &bull; Multi-Agent Pedagogical Synthesis
      </footer>

    </div>
  );
}
