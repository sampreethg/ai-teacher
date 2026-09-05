'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  GraduationCap, 
  ArrowLeft, 
  Brain, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  AlertTriangle,
  Loader2,
  Send,
  RotateCcw,
  Hand,
  Mic
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LiveAvatar, { LiveAvatarRef } from '@/components/studio/LiveAvatar';
import { useTheme } from 'next-themes';
import { getVoiceByLanguage } from '@/lib/config/voices';

function ClassroomContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const format = searchParams.get('format');
  const lang = searchParams.get('lang') || 'en-GB';
  const voiceIdParam = searchParams.get('voice_id') || getVoiceByLanguage(lang).id;
  const focus = searchParams.get('focus');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    result: string;
    score: number;
    explanation: string;
    misconception?: string;
    recommended_action?: string;
  } | null>(null);
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  
  // "Raise Hand" & Voice Questioning States
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingDoubt, setIsAnalyzingDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState<string>('');
  const [doubtExplanation, setDoubtExplanation] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  const avatarRef = useRef<LiveAvatarRef>(null);

  const topicTitle = focus || "Newton's Second Law";

  // Handle student raising hand to interrupt & ask doubt
  const handleRaiseHand = async () => {
    // 1. Immediately interrupt avatar speech
    if (avatarRef.current) {
      await avatarRef.current.interrupt();
    }

    // Toggle listening off if currently active
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('Error stopping recognition:', e);
        }
      }
      setIsListening(false);
      return;
    }

    setDoubtExplanation(null);
    setDoubtText('');

    // 2. Initialize Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for browsers without speech recognition
      const simulatedDoubt = "Why does acceleration stay constant if both force and mass are doubled?";
      setDoubtText(simulatedDoubt);
      await submitDoubtToBackend(simulatedDoubt);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        if (transcript.trim()) {
          setDoubtText(transcript);
          await submitDoubtToBackend(transcript);
        }
      };

      recognition.onerror = async (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        // If no speech heard or permission denied, provide fallback prompt
        if (!doubtText) {
          const fallbackDoubt = "Can you explain how mass and force balance out in F = m * a?";
          setDoubtText(fallbackDoubt);
          await submitDoubtToBackend(fallbackDoubt);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      const fallbackDoubt = "Can you explain how mass and force balance out in F = m * a?";
      setDoubtText(fallbackDoubt);
      await submitDoubtToBackend(fallbackDoubt);
    }
  };

  // Submit transcribed doubt to Python FastAPI Backend
  const submitDoubtToBackend = async (question: string) => {
    setIsAnalyzingDoubt(true);
    try {
      const res = await fetch('http://localhost:8000/ask_doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          topic: topicTitle,
          lesson: lessonContent || "Newton's Second Law: F = m * a",
          language: lang
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const explanation = data.explanation || data.response || "Let me clarify that for you.";
        setDoubtExplanation(explanation);
        // Have HeyGen avatar speak the explanation
        avatarRef.current?.speak(explanation);
      } else {
        // Fallback explanation
        const fallback = "When both force and mass are doubled, acceleration stays constant because acceleration is force divided by mass: (2F) over (2m) simplifies right back to F over m.";
        setDoubtExplanation(fallback);
        avatarRef.current?.speak(fallback);
      }
    } catch (err) {
      console.error('Error asking doubt:', err);
    } finally {
      setIsAnalyzingDoubt(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);

    // Call FastAPI Lesson Generator on start
    async function fetchLesson() {
      setIsLoadingLesson(true);
      try {
        const res = await fetch('http://localhost:8000/api/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicTitle,
            level: 'Beginner',
            language: lang || 'English',
            duration: format === 'short' ? 5 : format === 'cinematic' ? 60 : 20,
            style: 'Conceptual & Real-world examples'
          })
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          setLessonContent(data.lesson || '');
        } else {
          setLessonContent(
            "Newton's Second Law of Motion: F_net = m * a. Acceleration is directly proportional to applied force and inversely proportional to inertial mass."
          );
        }
      } catch (err) {
        console.error('Failed to load lesson from FastAPI:', err);
      } finally {
        setIsLoadingLesson(false);
      }
    }

    fetchLesson();
  }, [topicTitle, lang, format]);

  // Submit Answer to FastAPI Socratic Evaluation Engine
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || isEvaluating) return;
    setIsEvaluating(true);

    const questionText = "If an applied force is doubled while the mass of the object is also doubled, what happens to the acceleration?";
    const studentAnswerText = selectedAnswer === 'A' ? "It doubles" : "It stays exactly the same";
    const correctAnswerText = "It stays exactly the same";

    try {
      const res = await fetch('http://localhost:8000/evaluate_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          correct_answer: correctAnswerText,
          student_answer: studentAnswerText,
          lesson: lessonContent || "F = m * a, so a = F / m"
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        // Resilient deterministic fallback
        const isCorrect = selectedAnswer === 'B';
        const fallback = {
          result: isCorrect ? 'CORRECT' : 'INCORRECT',
          score: isCorrect ? 100 : 0,
          explanation: isCorrect
            ? 'Mastery Confirmed! (2F) / (2m) = F/m = a. The factor of 2 cancels out in both numerator and denominator, leaving acceleration unchanged.'
            : 'Misconception Detected! Both force and mass doubled, so the ratio 2F over 2m cancels out to 1, leaving acceleration unchanged.',
          misconception: isCorrect
            ? ''
            : 'Student assumes doubling force always doubles acceleration even when mass is proportionally doubled.',
          recommended_action: isCorrect ? 'CONTINUE' : 'RETEACH'
        };
        setEvaluationResult(fallback);
        avatarRef.current?.speak(fallback.explanation);
        return;
      }

      const data = await res.json();
      setEvaluationResult(data);
      avatarRef.current?.speak(data.explanation || (data.result === 'CORRECT' ? 'Mastery Confirmed!' : 'Misconception Detected!'));
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setEvaluationResult(null);
  };

  const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Top Classroom Bar */}
      <header className={`sticky top-0 z-50 glass-panel border-b px-4 sm:px-6 h-16 flex items-center justify-between ${
        isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-4">
          <Link 
            href="/studio"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-800' 
                : 'border-slate-300 text-slate-700 hover:text-cyan-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Studio
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:inline">AI Classroom Session</span>
          </div>

          {isDemo && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-semibold uppercase tracking-wider">
              One-Time Instant Demo
            </span>
          )}

          {format && (
            <span className="hidden md:inline-flex text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-cyan-300 border border-blue-500/30 font-semibold uppercase tracking-wider">
              {format === 'short' ? '5 Min Overview' : format === 'cinematic' ? '60 Min Deep Dive' : '20 Min Explainer'} &bull; {lang?.toUpperCase() || 'EN'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm hover:from-cyan-400 hover:to-blue-500"
          >
            Save Session
          </Link>
        </div>
      </header>

      {/* Main Classroom Screen */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
          
          {/* Avatar Video Column (Live HeyGen WebRTC Stream) */}
          <div className="lg:col-span-5 flex flex-col min-h-[460px]">
            <LiveAvatar
              ref={avatarRef}
              autoStart={false}
              avatarBackendUrl="http://localhost:3001"
              voiceId={voiceIdParam}
              language={lang}
              educatorName="Dr. Alex"
              educatorTitle="Lead AI Physics Educator"
              statusOverlay={
                isListening
                  ? "Listening to your doubt..."
                  : isAnalyzingDoubt
                  ? "Analyzing doubt with Gemini..."
                  : null
              }
              className="flex-1"
            />

            {/* Raise Hand & Voice Interaction Control Bar */}
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                id="raise-hand-button"
                onClick={handleRaiseHand}
                disabled={!isSpeechSupported || isAnalyzingDoubt}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md ${
                  !isSpeechSupported
                    ? 'bg-amber-600/50 text-white/50 cursor-not-allowed opacity-50'
                    : isListening
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30 cursor-pointer'
                    : isAnalyzingDoubt
                    ? 'bg-amber-600 text-white opacity-80 cursor-wait'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-[0.99] cursor-pointer'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 animate-bounce text-white" />
                    <span>Listening to your voice... (Click to Finish)</span>
                  </>
                ) : isAnalyzingDoubt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing doubt...</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-4 h-4 text-white" />
                    <span>Raise Hand &bull; Ask Doubt</span>
                  </>
                )}
              </button>
              {!isSpeechSupported && (
                <div className="text-center text-[10px] text-slate-500 mt-1">
                  * Voice input requires Chrome/Edge.
                </div>
              )}

              {/* Live Captured Doubt & Explanation Pill */}
              {(doubtText || doubtExplanation) && (
                <div className={`p-3 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                  isDarkMode ? 'bg-slate-900/95 border-amber-500/30' : 'bg-amber-50/80 border-amber-200'
                }`}>
                  {doubtText && (
                    <div className="flex items-start gap-2">
                      <Mic className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                          Student Doubt
                        </span>
                        <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          &ldquo;{doubtText}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {doubtExplanation && (
                    <div className={`pt-2 border-t flex items-start gap-2 ${
                      isDarkMode ? 'border-slate-800 text-slate-300' : 'border-amber-200 text-slate-700'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider block">
                          AI Teacher Clarification
                        </span>
                        <p className="leading-relaxed">
                          {doubtExplanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Whiteboard Canvas Column */}
          <div className={`lg:col-span-7 rounded-2xl border p-6 flex flex-col justify-between font-mono relative overflow-hidden ${
            isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className={`flex justify-between items-center pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-500">Live Mathematical Canvas</span>
                {isLoadingLesson && (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating lesson...
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-sans">{topicTitle} &bull; Module 1</span>
            </div>

            <div className="my-auto space-y-5 py-6">
              
              {/* Fundamental Derivation Card */}
              <div className={`p-5 rounded-xl border font-sans space-y-2 ${
                isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-cyan-500 uppercase tracking-wide">Fundamental Derivation</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    FastAPI Engine Active
                  </span>
                </div>
                <div className={`text-xl sm:text-2xl font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  F_net = m &middot; a &rArr; a = F / m
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Acceleration is directly proportional to net applied force vector and inversely proportional to inertial mass.
                </p>
              </div>

              {/* Socratic Checkpoint Card */}
              <div className={`p-5 rounded-xl border font-sans space-y-3.5 ${
                isDarkMode ? 'bg-slate-900/90 border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-600 dark:text-cyan-300">
                    <Brain className="w-4 h-4 text-cyan-500" />
                    Socratic Diagnostic Checkpoint
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40 font-semibold">
                    Python RAG Evaluator
                  </span>
                </div>

                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  &quot;If an applied force is doubled while the mass of the object is also doubled, what happens to the acceleration?&quot;
                </p>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswer('A');
                      setEvaluationResult(null);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      selectedAnswer === 'A'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500' : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedAnswer === 'A' ? 'bg-amber-500 text-slate-950' : 'bg-slate-600 text-white'
                    }`}>A</span>
                    <span>It doubles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswer('B');
                      setEvaluationResult(null);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                      selectedAnswer === 'B'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500' : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedAnswer === 'B' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-600 text-white'
                    }`}>B</span>
                    <span>It stays exactly the same</span>
                  </button>
                </div>

                {/* Submit Answer Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {selectedAnswer ? `Selected option [${selectedAnswer}]` : 'Select an answer above to evaluate'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {evaluationResult && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!selectedAnswer || isEvaluating}
                      onClick={handleSubmitAnswer}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Evaluation Result Feedback */}
                {evaluationResult && (
                  <div className="space-y-3 pt-2">
                    {/* Status Badge */}
                    <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      evaluationResult.result === 'CORRECT'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                    }`}>
                      {evaluationResult.result === 'CORRECT' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="font-bold uppercase tracking-wider text-[10px]">
                          {evaluationResult.result === 'CORRECT' ? 'Mastery Confirmed' : 'Needs Review'} &bull; Score: {evaluationResult.score}%
                        </div>
                        <p className="leading-relaxed">
                          {evaluationResult.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Dedicated Misconception Remediation Card if Detected */}
                    {(evaluationResult.result === 'INCORRECT' || evaluationResult.misconception) && (
                      <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-xs space-y-2 animate-fadeIn">
                        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Misconception Detected by AI Teacher</span>
                        </div>

                        {evaluationResult.misconception && (
                          <div className="text-slate-200 text-xs pl-6">
                            <strong>Diagnostic Analysis:</strong> {evaluationResult.misconception}
                          </div>
                        )}

                        <div className="text-slate-300 text-[11px] pl-6 bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/30">
                          <strong className="text-rose-300">Remediation Guide:</strong> Notice how force is in the numerator and mass is in the denominator: <code>a = (2F) / (2m) = (2/2) &middot; (F/m) = 1 &middot; a</code>. The factors of 2 cancel each other out algebraically!
                        </div>

                        {evaluationResult.recommended_action && (
                          <div className="text-[10px] text-rose-300/80 pl-6 uppercase font-bold">
                            Adaptive Action: {evaluationResult.recommended_action}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            <div className={`flex justify-between items-center pt-3 border-t text-xs font-sans ${
              isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'
            }`}>
              <span>Topic: <strong className="text-cyan-500 font-semibold">{topicTitle}</strong></span>
              <Link href="/login" className="text-cyan-500 hover:underline font-semibold">
                Sign up to save full diagnostic report &rarr;
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-cyan-400 font-mono">Loading Classroom...</div>}>
      <ClassroomContent />
    </Suspense>
  );
}
