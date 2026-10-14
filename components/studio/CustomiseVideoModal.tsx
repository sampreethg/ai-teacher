'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Video,
  X,
  Sparkles,
  Pencil,
  Play
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, getVoiceByLanguage } from '@/lib/config/voices';

export interface CustomiseVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceCount?: number;
  lessonTitle?: string;
  sources?: any[];
}

export type VideoFormat = 'short' | 'explainer' | 'cinematic';

export default function CustomiseVideoModal({
  isOpen,
  onClose,
  sourceCount = 0,
  lessonTitle = 'New Lesson',
  sources = []
}: CustomiseVideoModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Derive dynamic base topic from sources, title, or URL
  const baseTopic = useMemo(() => {
    if (sources && sources.length > 0 && sources[0].title) {
      return sources[0].title;
    }
    if (lessonTitle && lessonTitle !== 'New Lesson' && lessonTitle !== 'Loading Lesson...' && lessonTitle !== 'Untitled Lesson') {
      return lessonTitle;
    }
    return "Newton's Second Law & Classical Mechanics";
  }, [sources, lessonTitle]);

  // Modal State
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('explainer');
  const [selectedLanguage, setSelectedLanguage] = useState('en-GB');
  const [selectedSourcesMode, setSelectedSourcesMode] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSelectedTopic(`Fundamental Principles & Derivations of ${baseTopic}`);
  }, [baseTopic]);

  if (!isOpen || !mounted) return null;

  const suggestedTopics = [
    `Fundamental Principles & Derivations of ${baseTopic}`,
    `Real-World Applications & Edge Cases of ${baseTopic}`,
    `Socratic Problem Solving & Mastery for ${baseTopic}`
  ];

  const handleSelectSuggestedTopic = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
  };

  const handleGenerateNow = () => {
    setIsGenerating(true);
    const finalTopic = customTopic.trim() || selectedTopic || baseTopic;
    const voiceConfig = getVoiceByLanguage(selectedLanguage);
    const queryParams = new URLSearchParams({
      format: selectedFormat,
      lang: selectedLanguage,
      voice_id: voiceConfig.id,
      focus: finalTopic
    });

    // Save active sources into sessionStorage so classroom picks them up immediately
    if (sources && sources.length > 0) {
      sessionStorage.setItem('activeSources', JSON.stringify(sources));
    } else {
      // Create a virtual grounded source from the user's topic so the AI classroom grounds in it
      sessionStorage.setItem('activeSources', JSON.stringify([{
        title: finalTopic,
        snippet: `Comprehensive educational curriculum, formulas, and derivations for ${finalTopic}. Ready for interactive AI Teacher classroom lecture.`,
        type: 'note'
      }]));
    }

    setTimeout(() => {
      onClose();
      router.push(`/classroom?${queryParams.toString()}`);
    }, 350);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      
      {/* Modal Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="customise-video-title"
        className="bg-white dark:bg-[#1e1f20] border border-slate-200 dark:border-[#2d2f31] rounded-2xl w-full max-w-3xl p-5 sm:p-6 text-slate-900 dark:text-[#e3e3e3] shadow-2xl animate-scaleIn relative overflow-hidden max-h-[92vh] flex flex-col font-sans"
      >
        
        {/* 1. HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2d2f31] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 id="customise-video-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Customise Video Lecture</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8e918f]">
                Configure interactive AI Educator lecture duration, language, and specific topic focus.
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#131314] dark:hover:bg-[#282a2c] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          
          {/* 2. FORMAT SELECTION */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase mb-2">
              FORMAT & DURATION
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Short (5 mins) */}
              <div
                onClick={() => setSelectedFormat('short')}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                  selectedFormat === 'short'
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Short Overview</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      5 mins
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#8e918f] leading-relaxed">
                    Rapid summary covering high-level principles and fundamental intuition.
                  </p>
                </div>
              </div>

              {/* Explainer (20 mins) */}
              <div
                onClick={() => setSelectedFormat('explainer')}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                  selectedFormat === 'explainer'
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Explainer Lecture</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      20 mins
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#8e918f] leading-relaxed">
                    Standard deep dive with blackboard derivations and step-by-step reasoning.
                  </p>
                </div>
              </div>

              {/* Cinematic (60 mins) */}
              <div
                onClick={() => setSelectedFormat('cinematic')}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                  selectedFormat === 'cinematic'
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa] shadow-sm'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Cinematic Masterclass</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      60 mins
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#8e918f] leading-relaxed">
                    Exhaustive curriculum coverage with comprehensive derivations and case studies.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. LANGUAGE & SOURCES SETTINGS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Language */}
            <div className="space-y-1.5">
              <label htmlFor="select-language" className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                EDUCATOR LANGUAGE
              </label>
              <div className="relative">
                <select
                  id="select-language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => (
                    <option key={code} value={code}>
                      {config.nativeName} ({config.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sources Grounding */}
            <div className="space-y-1.5">
              <label htmlFor="select-sources" className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                SOURCES GROUNDING
              </label>
              <div className="relative">
                <select
                  id="select-sources"
                  value={selectedSourcesMode}
                  onChange={(e) => setSelectedSourcesMode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {sources.length > 0 ? (
                    <>
                      <option value="all">All uploaded materials ({sources.length} sources)</option>
                      <option value="primary">Primary documents only</option>
                    </>
                  ) : (
                    <option value="direct">
                      Direct topic lecture (Grounded in: &ldquo;{baseTopic}&rdquo;)
                    </option>
                  )}
                </select>
              </div>
            </div>

          </div>

          {/* 4. FOCUS & TOPIC CUSTOMIZATION */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                WHAT SHOULD THE AI TEACHER FOCUS ON?
              </label>
              <p className="text-[11px] text-slate-500 dark:text-[#8e918f] mt-0.5">
                Grounded in your active topic, uploaded sources, or custom study instructions.
              </p>
            </div>

            {/* Suggested Dynamic Pills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {suggestedTopics.map((topic, idx) => {
                const isSelected = selectedTopic === topic && !customTopic;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestedTopic(topic)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa]'
                        : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                      {topic}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="relative mt-2">
              <Pencil className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={`Customise topic (e.g. In-depth mathematical derivations and Socratic quiz for ${baseTopic})`}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e918f] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

        </div>

        {/* 5. FOOTER & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#2d2f31] shrink-0">
          
          <div className="w-full sm:w-auto text-left space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-[#8e918f]">
              Target: <strong className="text-cyan-600 dark:text-cyan-400">{customTopic.trim() || selectedTopic || baseTopic}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-transparent text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282a2c] text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="modal-generate-now-btn"
              onClick={handleGenerateNow}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-[#0b57d0] dark:hover:bg-[#1b6ef3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isGenerating ? 'Configuring lecture...' : 'Launch AI Classroom Now &rarr;'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
}
