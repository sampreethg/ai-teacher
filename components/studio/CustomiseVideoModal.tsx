'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Video,
  X,
  Check,
  Sparkles,
  Pencil,
  Clock,
  Layers,
  Globe,
  Sliders,
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
  sourceCount = 25,
  lessonTitle = 'The Google Account Authentication Portal',
  sources = []
}: CustomiseVideoModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('explainer');
  const [selectedLanguage, setSelectedLanguage] = useState('en-GB');
  const [selectedSourcesMode, setSelectedSourcesMode] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('OAuth 2.0 PKCE Handshake & Cryptographic Proof');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelectSuggestedTopic = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
  };

  const handleGenerateNow = () => {
    setIsGenerating(true);
    const finalTopic = customTopic.trim() || selectedTopic;
    const voiceConfig = getVoiceByLanguage(selectedLanguage);
    const queryParams = new URLSearchParams({
      format: selectedFormat,
      lang: selectedLanguage,
      voice_id: voiceConfig.id,
      focus: finalTopic
    });

    if (sources && sources.length > 0) {
      sessionStorage.setItem('activeSources', JSON.stringify(sources));
    } else {
      sessionStorage.removeItem('activeSources');
    }

    setTimeout(() => {
      onClose();
      router.push(`/classroom?${queryParams.toString()}`);
    }, 400);
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
                <span>Customise Video Overview</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#8e918f]">
                Configure interactive AI Educator lecture duration, language, and specific focus.
              </p>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#131314] dark:hover:bg-[#282a2c] flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          
          {/* 2. FORMAT SELECTION (TIME-BASED LEARNING) */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase mb-2">
              FORMAT & DURATION
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Card 1: Short (5 mins) */}
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Short (5 mins)
                      </span>
                      <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        New!
                      </span>
                    </div>
                    {selectedFormat === 'short' && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8e918f] leading-snug">
                    A bite-sized overview to help you quickly grasp core ideas from your sources.
                  </p>
                </div>
              </div>

              {/* Card 2: Explainer (20 mins) */}
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
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Explainer (20 mins)
                    </span>
                    {selectedFormat === 'explainer' && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8e918f] leading-snug">
                    A structured, comprehensive overview that connects the dots within your sources.
                  </p>
                </div>
              </div>

              {/* Card 3: Cinematic (60 mins) */}
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
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Cinematic (60 mins)
                    </span>
                    {selectedFormat === 'cinematic' && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-[#8e918f] leading-snug">
                    A rich, immersive experience that can unpack complex ideas through engaging visuals.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 3. DROPDOWN CONFIGURATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Choose Language */}
            <div className="space-y-1.5">
              <label htmlFor="select-language" className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                CHOOSE LANGUAGE
              </label>
              <div className="relative">
                <select
                  id="select-language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="hinglish">Hinglish (Hindi + English)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>
            </div>

            {/* Sources */}
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
                  <option value="all">All active sources ({sourceCount} sources)</option>
                  <option value="primary">Key documents only (Top 5 primary papers)</option>
                  <option value="custom">Uploaded lecture notes & textbooks</option>
                </select>
              </div>
            </div>

          </div>

          {/* 4. FOCUS & TOPIC CUSTOMIZATION */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-slate-500 dark:text-[#8e918f] uppercase">
                WHAT SHOULD THE VIDEO FOCUS ON?
              </label>
              <p className="text-[11px] text-slate-500 dark:text-[#8e918f] mt-0.5">
                Choose a suggested conceptual focus or type custom derivation instructions.
              </p>
            </div>

            {/* Suggested Pills: 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              
              <div
                onClick={() => handleSelectSuggestedTopic('OAuth 2.0 PKCE Handshake & Cryptographic Proof')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                  selectedTopic === 'OAuth 2.0 PKCE Handshake & Cryptographic Proof' && !customTopic
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa]'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                  OAuth 2.0 PKCE Handshake & Cryptographic Proof
                </span>
              </div>

              <div
                onClick={() => handleSelectSuggestedTopic('BeyondCorp Zero-Trust & Dynamic Policy Context')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                  selectedTopic === 'BeyondCorp Zero-Trust & Dynamic Policy Context' && !customTopic
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa]'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                  BeyondCorp Zero-Trust & Dynamic Policy Context
                </span>
              </div>

              <div
                onClick={() => handleSelectSuggestedTopic('FIDO2 WebAuthn & Hardware Enclave Fallback')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                  selectedTopic === 'FIDO2 WebAuthn & Hardware Enclave Fallback' && !customTopic
                    ? 'bg-blue-50/70 dark:bg-[#282a2c] border-blue-500 dark:border-[#a8c7fa]'
                    : 'bg-slate-50 dark:bg-[#131314] border-slate-200 dark:border-[#2d2f31]/60 hover:bg-slate-100 dark:hover:bg-[#282a2c]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                  FIDO2 WebAuthn & Hardware Enclave Fallback
                </span>
              </div>

            </div>

            {/* Custom Input */}
            <div className="relative mt-2">
              <Pencil className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Customised topic (e.g. step-by-step mathematical proof of code challenge equality)"
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-[#131314] border border-slate-300 dark:border-[#444746] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8e918f] outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

        </div>

        {/* 5. FOOTER & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-[#2d2f31] shrink-0">
          
          {/* Left: AI Usage Indicator */}
          <div className="w-full sm:w-auto text-left space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8e918f]">
              <span>AI usage: Already used 45 min / Estimated use {selectedFormat === 'short' ? '5 min' : selectedFormat === 'explainer' ? '20 min' : '60 min'}</span>
            </div>
            <div className="w-full sm:w-60 h-1.5 bg-slate-200 dark:bg-[#282a2c] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: selectedFormat === 'short' ? '25%' : selectedFormat === 'explainer' ? '55%' : '85%' }}
              />
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-transparent text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#282a2c] text-xs font-medium transition-colors cursor-pointer"
            >
              Generate later
            </button>

            <button
              type="button"
              onClick={handleGenerateNow}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-[#0b57d0] dark:hover:bg-[#1b6ef3] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isGenerating ? 'Configuring lecture...' : 'Generate now'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
}
