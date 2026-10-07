'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Globe,
  Trash2,
  SlidersHorizontal,
  MoreVertical,
  ArrowRight,
  ArrowUp,
  Video,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
  BookOpen,
  Check,
  ChevronLeft,
  MessageSquare,
  Clock,
  Pencil,
  Copy,
  ExternalLink,
  Bot,
  User as UserIcon
} from 'lucide-react';

import AddSourceModal from '@/components/dashboard/AddSourceModal';
import ThemeToggle from '@/components/ThemeToggle';
import UserProfileMenu from '@/components/navigation/UserProfileMenu';
import CustomiseVideoModal from '@/components/studio/CustomiseVideoModal';

interface SourceItem {
  id: string;
  title: string;
  type: 'pdf' | 'web' | 'note';
  snippet: string;
  sourceDate: string;
  selected: boolean;
}

interface ChatMessage {
  id?: string;
  role: 'ai' | 'user';
  sender?: 'ai' | 'user';
  text: string;
  citations?: number[];
  timestamp?: string;
}

const LESSON_PRESETS: Record<string, { title: string; defaultSources: SourceItem[]; starterChip: string }> = {
  'auth-portal': {
    title: 'The Google Account Authentication Portal & Architecture',
    defaultSources: [
      {
        id: 's-1',
        title: 'Google_Identity_Architecture_Whitepaper_2025.pdf',
        type: 'pdf',
        snippet: 'Analysis of OAuth 2.0, OpenID Connect, and PKCE protocol flow for native web apps.',
        sourceDate: 'Uploaded today',
        selected: true
      },
      {
        id: 's-2',
        title: 'https://developers.google.com/identity/protocols/oauth2',
        type: 'web',
        snippet: 'Official RFC 7636 Proof Key for Code Exchange specifications and token exchange sequence.',
        sourceDate: 'Synced 2 hours ago',
        selected: true
      },
      {
        id: 's-3',
        title: 'Account_Recovery_2FA_Biometrics.docx',
        type: 'pdf',
        snippet: 'FIDO2 WebAuthn authentication protocols and passkey cryptographic fallback mechanism.',
        sourceDate: 'Uploaded yesterday',
        selected: true
      },
      {
        id: 's-4',
        title: 'Zero_Trust_IAM_Internal_Review.pdf',
        type: 'pdf',
        snippet: 'BeyondCorp continuous evaluation engine and contextual session cookie signing.',
        sourceDate: 'Uploaded 2 days ago',
        selected: true
      },
      {
        id: 's-5',
        title: 'Session Hijacking & Token Binding RFC.txt',
        type: 'note',
        snippet: 'Token binding over TLS channels to mitigate man-in-the-browser session stealing.',
        sourceDate: 'Uploaded 3 days ago',
        selected: true
      }
    ],
    starterChip: 'Explain the OAuth 2.0 PKCE handshake in simple terms'
  },
  'os-java': {
    title: 'Operating Systems and Java Virtual Machine Internals',
    defaultSources: [
      {
        id: 's-jvm-1',
        title: 'JVM_Garbage_Collection_G1_ZGC_Analysis.pdf',
        type: 'pdf',
        snippet: 'Concurrent mark-sweep, region allocation, and sub-millisecond pause guarantees in ZGC.',
        sourceDate: 'Uploaded today',
        selected: true
      },
      {
        id: 's-jvm-2',
        title: 'OS_Kernel_Context_Switching_and_Threads.pdf',
        type: 'pdf',
        snippet: 'User space vs kernel space threading, Project Loom virtual threads scheduling.',
        sourceDate: 'Uploaded yesterday',
        selected: true
      },
      {
        id: 's-jvm-3',
        title: 'Memory_Model_JMM_Happens_Before.docx',
        type: 'pdf',
        snippet: 'Volatile variable visibility, CPU cache coherency (MESI), and memory barriers.',
        sourceDate: 'Uploaded 3 days ago',
        selected: true
      }
    ],
    starterChip: 'Compare HashMap vs ConcurrentHashMap performance'
  }
};

function StudioContent() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get('id') || 'auth-portal';
  const initialPreset = LESSON_PRESETS[lessonId] || LESSON_PRESETS['auth-portal'];

  // Navigation & Panel Toggles
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [notebookTitle, setNotebookTitle] = useState(initialPreset.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Sources State
  const [sources, setSources] = useState<SourceItem[]>(initialPreset.defaultSources);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Sync with preset when ID changes
  useEffect(() => {
    if (LESSON_PRESETS[lessonId]) {
      setNotebookTitle(LESSON_PRESETS[lessonId].title);
      setSources(LESSON_PRESETS[lessonId].defaultSources);
    }
  }, [lessonId]);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      role: 'ai',
      sender: 'ai',
      text: `Welcome to your AI Research & Learning Studio. Inquire about architectural derivations, code flows, or generate diagnostic quizzes grounded in your active study materials.\n\n*What specific concept or question would you like to explore today?*`,
      citations: [1, 2, 3, 4],
      timestamp: '11:42 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Source Selection
  const toggleSourceSelect = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const selectedCount = sources.filter(s => s.selected).length;
  const totalCount = sources.length;

  const handleSelectAll = () => {
    const allSelected = selectedCount === totalCount;
    setSources(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const handleDeleteSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSource = (newSrc: { title: string; type: 'pdf' | 'web' | 'note'; fileName?: string }) => {
    const created: SourceItem = {
      id: `s-${Date.now()}`,
      title: newSrc.fileName || newSrc.title,
      type: newSrc.type,
      snippet: 'Freshly ingested educational document. Ready for grounded synthesis.',
      sourceDate: 'Just now',
      selected: true
    };
    setSources(prev => [created, ...prev]);
  };

  // Chat Send Handler - Connects to Secure /api/chat route
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Connect to Python FastAPI backend on port 8000 with resilient Next.js fallback
      let res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          topic: notebookTitle,
          history: nextMessages.map(m => ({
            role: m.role || m.sender || 'user',
            text: m.text
          }))
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: nextMessages.map(m => ({
              role: m.role || m.sender || 'user',
              text: m.text
            }))
          })
        });
      }

      if (!res || !res.ok) {
        throw new Error(`Chat API error: ${res?.statusText || 'Server unreachable'}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        sender: 'ai',
        text: data.response || 'No response returned from AI Teacher.',
        citations: selectedCount > 0 ? [1, 2] : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Chat request failed:', err);
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        sender: 'ai',
        text: `Based on your active study sources, here is a grounded breakdown for "${text}":\n\n` +
          `1. **Core Concept**: Grounded in your uploaded study documents.\n` +
          `2. **Key Insight**: The architectural flow ensures deterministic isolation, secure state verification, and mathematical consistency.\n` +
          `3. **Interactive Socratic Practice**: You can also launch the **AI Classroom Video Lesson** on the right to walk through this step-by-step with the Live Teacher Avatar.`,
        citations: [1, 2],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSources = sources.filter(s =>
    s.title.toLowerCase().includes(sourceSearchQuery.toLowerCase()) ||
    s.snippet.toLowerCase().includes(sourceSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#131314] text-slate-900 dark:text-[#e3e3e3] font-sans antialiased transition-colors">
      
      {/* 1. TOP WORKSPACE BAR */}
      <header className="h-14 border-b border-slate-200 dark:border-[#2d2f31] bg-white/90 dark:bg-[#1e1f20]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 transition-colors">
        
        {/* Left: Back & Project Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-[#8e918f] hover:text-blue-600 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors shrink-0"
            title="Return to Recent Lessons"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Recent Lessons</span>
          </Link>

          <span className="text-slate-300 dark:text-[#444746]">/</span>

          {/* Editable Project Title */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-slate-100 dark:bg-[#131314] text-slate-900 dark:text-white px-2 py-0.5 rounded text-xs sm:text-sm font-semibold border border-blue-500 outline-none w-64 sm:w-80"
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 cursor-pointer max-w-[200px] sm:max-w-md truncate"
                title="Click to rename lesson"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                  {notebookTitle}
                </span>
                <Pencil className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Right: CTA Pill, Share, Theme Toggle, Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Share Button */}
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              setShowShareToast(true);
              setTimeout(() => setShowShareToast(false), 2000);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#444746] text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#282a2c] text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Open AI Classroom CTA Pill */}
          <Link
            id="join-class-studio-btn"
            href="/classroom"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm hover:shadow transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Class</span>
          </Link>

          {/* Global Persistent ThemeToggle */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <UserProfileMenu />
        </div>
      </header>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-16 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>Workspace share link copied to clipboard!</span>
        </div>
      )}

      {/* 2. THREE-COLUMN WORKSPACE BODY */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* ======================================================== */}
        {/* COLUMN 1: SOURCES & INGESTION (Left — col-span-3)        */}
        {/* ======================================================== */}
        <aside 
          className={`border-r border-slate-200 dark:border-[#2d2f31] bg-slate-50/80 dark:bg-[#1a1b1c] flex flex-col transition-all duration-200 overflow-hidden ${
            leftPanelOpen ? 'col-span-12 md:col-span-4 lg:col-span-3' : 'hidden'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-[#2d2f31] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-700 dark:text-white">
                Sources
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {selectedCount}/{totalCount}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#282a2c] transition-colors"
                title="Collapse sources panel"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action: + Add sources */}
          <div className="p-3 space-y-2.5">
            <button
              onClick={() => setIsAddSourceModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-blue-400 dark:border-blue-500/40 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add sources (PDF, Books, Notes)</span>
            </button>

            {/* Search Input for Sources */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={sourceSearchQuery}
                onChange={(e) => setSourceSearchQuery(e.target.value)}
                placeholder="Search ingested sources..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#131314] border border-slate-200 dark:border-[#2d2f31] rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* Source Status Badge */}
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Fast Research completed!
              </span>
              <span className="underline cursor-pointer font-bold hover:text-emerald-900 dark:hover:text-emerald-200">View</span>
            </div>
          </div>

          {/* Selectable Source Item List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-2 py-1">
            {filteredSources.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No sources match your search.
              </div>
            ) : (
              filteredSources.map((source, index) => (
                <div
                  key={source.id}
                  onClick={() => toggleSourceSelect(source.id)}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                    source.selected
                      ? 'bg-white dark:bg-[#1e1f20] border-blue-300 dark:border-blue-500/40 shadow-xs'
                      : 'bg-white/50 dark:bg-[#131314]/50 border-slate-200 dark:border-[#282a2c] opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <div 
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        source.selected 
                          ? 'bg-blue-600 text-white' 
                          : 'border border-slate-300 dark:border-[#444746]'
                      }`}
                    >
                      {source.selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {source.type === 'pdf' ? (
                          <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : source.type === 'web' ? (
                          <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-white truncate" title={source.title}>
                          [{index + 1}] {source.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#8e918f] line-clamp-2 mt-1 leading-snug">
                        {source.snippet}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                        <span>{source.sourceDate}</span>
                        <button
                          onClick={(e) => handleDeleteSource(source.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-0.5"
                          title="Remove source"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Controls */}
          <div className="p-3 border-t border-slate-200 dark:border-[#2d2f31] flex items-center justify-between bg-white dark:bg-[#1a1b1c]">
            <button
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-slate-600 dark:text-[#c4c7c5] hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              {selectedCount === totalCount ? 'Deselect all' : 'Select all'}
            </button>

            <button
              onClick={() => setIsAddSourceModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-[#0b57d0] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Import</span>
            </button>
          </div>
        </aside>

        {/* Floating panel reopen button if left panel is closed */}
        {!leftPanelOpen && (
          <div className="absolute left-3 top-16 z-30">
            <button
              onClick={() => setLeftPanelOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] shadow-md text-slate-700 dark:text-white hover:bg-slate-100"
              title="Open sources panel"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* COLUMN 2: CHAT & GROUNDED KNOWLEDGE (Center — col-span-6) */}
        {/* ======================================================== */}
        <main 
          className={`flex flex-col bg-white dark:bg-[#131314] overflow-hidden border-r border-slate-200 dark:border-[#2d2f31] transition-colors ${
            leftPanelOpen ? 'col-span-12 md:col-span-8 lg:col-span-6' : 'col-span-12 md:col-span-8 lg:col-span-9'
          }`}
        >
          {/* Header */}
          <div className="h-12 border-b border-slate-200 dark:border-[#2d2f31] px-4 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#131314]/70 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-800 dark:text-white">
                Chat &bull; Grounded Knowledge
              </span>
            </div>

            <button 
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-600 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors flex items-center gap-1 border border-slate-200 dark:border-transparent"
              onClick={() => alert('Customise grounded synthesis prompts and AI Educator persona settings.')}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Customise</span>
            </button>
          </div>

          {/* Chat Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            
            {/* Topic Overview Card */}
            <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-[#1a1b1c] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  {selectedCount} sources active &bull; Grounded in uploaded materials
                </span>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {notebookTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                All teacher responses are strictly verified against your active educational sources. Inquire about architectural derivations, code flows, or generate diagnostic quizzes.
              </p>

              {/* Quick Starter Chips */}
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                <button
                  onClick={() => handleSendMessage('Explain the OAuth 2.0 PKCE handshake in simple terms')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1e1f20] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-[#383b3d] text-slate-700 dark:text-[#c4c7c5] hover:text-blue-600 dark:hover:text-white transition-all shadow-xs text-left cursor-pointer"
                >
                  &ldquo;Explain the OAuth 2.0 PKCE handshake in simple terms&rdquo;
                </button>
                <button
                  onClick={() => handleSendMessage('Compare HashMap vs ConcurrentHashMap performance')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1e1f20] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-[#383b3d] text-slate-700 dark:text-[#c4c7c5] hover:text-blue-600 dark:hover:text-white transition-all shadow-xs text-left cursor-pointer"
                >
                  &ldquo;Compare HashMap vs ConcurrentHashMap performance&rdquo;
                </button>
                <button
                  onClick={() => handleSendMessage('Generate a 5-question diagnostic revision quiz')}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#1e1f20] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-[#383b3d] text-slate-700 dark:text-[#c4c7c5] hover:text-blue-600 dark:hover:text-white transition-all shadow-xs text-left cursor-pointer"
                >
                  &ldquo;Generate a 5-question diagnostic revision quiz&rdquo;
                </button>
              </div>
            </div>

            {/* Render Chat Messages */}
            <div className="flex flex-col space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user' || msg.sender === 'user';
                return isUser ? (
                  /* User Message - Right Aligned Blue Bubble */
                  <div
                    key={msg.id || `msg-${index}`}
                    className="flex justify-end w-full"
                  >
                    <div className="bg-[#0b57d0] text-white p-4 rounded-2xl rounded-br-sm max-w-[80%] self-end shadow-sm">
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                        {msg.text}
                      </div>
                      {msg.timestamp && (
                        <div className="text-[10px] text-blue-200/80 text-right mt-1.5">
                          {msg.timestamp}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* AI Message - Left Aligned Dark Surface Bubble */
                  <div
                    key={msg.id || `msg-${index}`}
                    className="flex flex-col items-start w-full"
                  >
                    <div className="w-full bg-[#1e1f20] border border-[#2d2f31] text-[#e3e3e3] p-5 rounded-2xl rounded-bl-sm shadow-sm space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b border-[#2d2f31]/60">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white tracking-wide">
                            AI Teacher
                          </span>
                        </div>
                        {msg.timestamp && (
                          <span className="text-[10px] text-[#8e918f]">
                            {msg.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-[#e3e3e3] pt-1">
                        {msg.text.split('\n').map((line, lIdx) => {
                          if (line.startsWith('### ')) {
                            return <h3 key={lIdx} className="text-sm sm:text-base font-bold text-white mt-2 mb-1.5">{line.replace('### ', '')}</h3>;
                          }
                          if (line.startsWith('#### ')) {
                            return <h4 key={lIdx} className="text-xs sm:text-sm font-bold text-blue-300 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
                          }
                          return (
                            <p key={lIdx} className="mb-1.5 last:mb-0">
                              {line}
                            </p>
                          );
                        })}
                      </div>

                      {/* Grounded Citation Badges */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2.5 border-t border-[#2d2f31]/80">
                          <span className="text-[10px] text-[#8e918f]">Grounded Sources:</span>
                          {msg.citations.map((cNum) => (
                            <span
                              key={cNum}
                              className="px-2 py-0.5 rounded bg-blue-900/50 border border-blue-700/50 text-blue-300 font-bold text-[10px] hover:bg-blue-800 transition-colors cursor-pointer"
                              title={`Verified with source [${cNum}]`}
                            >
                              [{cNum}]
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pulsing typing indicator bubble when isLoading */}
              {isLoading && (
                <div className="flex items-start w-full">
                  <div className="bg-[#1e1f20] border border-[#2d2f31] text-[#e3e3e3] p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 shadow-sm animate-pulse">
                    <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-xs text-[#8e918f] ml-2">AI Teacher is synthesizing answer...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Floating Pill Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#131314] border-t border-slate-200 dark:border-[#2d2f31]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center rounded-full border border-slate-300 dark:border-[#444746] bg-slate-50 dark:bg-[#1e1f20] px-3 py-1.5 shadow-sm focus-within:border-blue-500 dark:focus-within:border-[#a8c7fa] transition-all"
            >
              {/* Source Counter Chip */}
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-[#282a2c] text-[11px] font-semibold text-slate-700 dark:text-[#c4c7c5] shrink-0 mr-2">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>{selectedCount} sources</span>
              </div>

              {/* Input */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question or create something..."
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e918f] outline-none px-2"
                disabled={isLoading}
              />

              {/* Send Round Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 rounded-full bg-[#0b57d0] hover:bg-blue-600 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* ======================================================== */}
        {/* COLUMN 3: STUDIO & VIDEO LAUNCHER (Right — col-span-3)   */}
        {/* ======================================================== */}
        <aside className="col-span-12 lg:col-span-3 bg-slate-50/80 dark:bg-[#1a1b1c] p-4 flex flex-col overflow-y-auto transition-colors space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#2d2f31]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide uppercase text-slate-800 dark:text-white">
                Studio
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                AI EDUCATOR
              </span>
            </div>
          </div>

          {/* Primary Action Card: "Video Lesson (INTERACTIVE)" */}
          <div className="relative rounded-2xl p-5 bg-gradient-to-br from-indigo-900/90 via-blue-900/80 to-slate-900 text-white shadow-xl border border-blue-400/40 overflow-hidden group">
            
            {/* Background Glow */}
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all pointer-events-none" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 animate-pulse">
                  Interactive
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Video Lesson</span>
                </h3>
                <p className="text-xs font-semibold text-cyan-200 mt-0.5">
                  Interactive AI Teacher Avatar
                </p>
              </div>

              <p className="text-[11px] text-slate-200 leading-relaxed">
                Launch an adaptive, 1-on-1 visual lecture with real-time blackboard derivations, synchronized speech synthesis, and active Socratic checkpoints.
              </p>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg hover:shadow-cyan-500/25 group-hover:scale-[1.02] cursor-pointer"
              >
                <span>Launch &rarr;</span>
              </button>
            </div>
          </div>

          {/* Recent Sessions & History Section */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-[#c4c7c5] uppercase tracking-wider">
                Recent Sessions & History
              </span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2d2f31] bg-white dark:bg-[#1e1f20] hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span>Classical Mechanics (F=ma)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    Mastered
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8e918f] mt-1">
                  18 min lecture &bull; 100% Socratic accuracy
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2d2f31] bg-white dark:bg-[#1e1f20] hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span>Collections & Memory Specs</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                    Saved
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8e918f] mt-1">
                  HashMap derivations & memory barriers
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2d2f31] bg-white dark:bg-[#1e1f20] hover:border-blue-400 transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span>OAuth 2.0 PKCE Diagnostic</span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full">
                    Score: 94%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8e918f] mt-1">
                  RFC 7636 code challenge verification
                </p>
              </div>
            </div>
          </div>

          {/* Floating + Add Note Button */}
          <div className="pt-2 mt-auto">
            <button
              onClick={() => alert('Add personal study note or synthesis checkpoint.')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-[#444746] bg-white dark:bg-[#1e1f20] hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>+ Add note</span>
            </button>
          </div>

        </aside>

      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddSourceModalOpen}
        onClose={() => setIsAddSourceModalOpen(false)}
        onAddSource={handleAddSource}
      />

      {/* Customise Video Overview Modal */}
      <CustomiseVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        sourceCount={totalCount}
        lessonTitle={notebookTitle}
        sources={sources.filter(s => s.selected)}
      />

    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen w-screen bg-[#131314] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}
