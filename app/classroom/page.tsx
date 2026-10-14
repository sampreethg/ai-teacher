'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
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
  AlertCircle, 
  Loader2, 
  Send, 
  RotateCcw, 
  Hand, 
  Mic, 
  Play, 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  Check, 
  ChevronRight,
  Volume2
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LiveAvatar, { LiveAvatarRef, AvatarStatus } from '@/components/studio/LiveAvatar';
import { useTheme } from 'next-themes';
import { getVoiceByLanguage } from '@/lib/config/voices';

export type ClassroomPhase = 'TEACHING' | 'ASSESSMENT';

function ClassroomContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const format = searchParams.get('format');
  const lang = searchParams.get('lang') || 'en-GB';
  const voiceIdParam = searchParams.get('voice_id') || getVoiceByLanguage(lang).id;
  const focus = searchParams.get('focus');
  const videoUrlParam = searchParams.get('video_url') || undefined;
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [topicTitle] = useState(focus || "Newton's Second Law");

  // Two Primary UX Modes: 'TEACHING' (Full Screen AI Teacher Class) vs 'ASSESSMENT' (Quiz Mode)
  const [phase, setPhase] = useState<ClassroomPhase>('TEACHING');
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);

  // Lesson Content States
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Avatar / Video Stream States
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  const avatarRef = useRef<LiveAvatarRef>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Quiz States (Conducted ONLY in 'ASSESSMENT' phase)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    result: string;
    score: number | null;
    explanation: string;
    misconception?: string;
    recommended_action?: string;
  } | null>(null);
  const [reteachContent, setReteachContent] = useState<string>('');

  // Source Grounding
  const [activeSourcesCount, setActiveSourcesCount] = useState<number>(0);

  // Voice Questioning ("Raise Hand") States
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingDoubt, setIsAnalyzingDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState<string>('');
  const [doubtExplanation, setDoubtExplanation] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Guard to prevent duplicate quiz generation
  const generationInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechSupported(!!SpeechRecognition);

      try {
        const stored = sessionStorage.getItem('activeSources');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setActiveSourcesCount(parsed.length);
          }
        }
      } catch {
        setActiveSourcesCount(0);
      }
    }
  }, []);

  // Fetch Lesson Content on Mount
  const fetchLesson = useCallback(async () => {
    setIsLoadingLesson(true);
    setLessonError(null);
    try {
      let sourcesContext = '';
      if (typeof window !== 'undefined') {
        const storedSources = sessionStorage.getItem('activeSources');
        if (storedSources) {
          try {
            sourcesContext = JSON.parse(storedSources)
              .map((s: any) => s.snippet || '')
              .filter(Boolean)
              .join('\n');
          } catch {
            sourcesContext = '';
          }
        }
      }

      // Try FastAPI backend first
      const res = await fetch('http://localhost:8000/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          level: 'Beginner',
          language: lang || 'English',
          duration: format === 'short' ? 5 : format === 'cinematic' ? 60 : 20,
          style: 'Conceptual & Real-world examples',
          context: sourcesContext
        }),
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setLessonContent(data.lesson || '');
      } else {
        // Fallback default lesson content grounded in topic
        setLessonContent(
          `Fundamental Derivations and Physical Principles of ${topicTitle}:\n\n` +
          `1. Net Force Vector and Acceleration:\n` +
          `   In classical mechanics, the net applied force vector is directly proportional to acceleration: F_net = m * a.\n\n` +
          `2. Inertial Mass Invariance:\n` +
          `   When mass is held invariant, doubling the applied force doubles the resultant acceleration (a = F / m).\n\n` +
          `3. Socratic Comprehension Checkpoint:\n` +
          `   Understanding dynamic balance and proportional derivations before moving to work-energy theorems.`
        );
      }
    } catch {
      setLessonContent(
        `Fundamental Derivations and Physical Principles of ${topicTitle}:\n\n` +
        `Newton's Second Law describes the quantitative relationship between force, mass, and acceleration: F_net = m * a.`
      );
    } finally {
      setIsLoadingLesson(false);
    }
  }, [topicTitle, lang, format]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Video progress and play state handlers
  const handleVideoProgress = useCallback((progress: number) => {
    setVideoProgress(progress);
  }, []);

  // Video Completion Handler: Triggers Automatic Transition to Quiz Mode
  const handleVideoCompleted = useCallback(() => {
    setVideoCompleted(true);
    setVideoProgress(100);
  }, []);

  // Generate Quiz: Strictly grounded in the topic taught
  const handleGenerateQuiz = useCallback(async () => {
    if (isGeneratingQuiz || generationInProgressRef.current) return;

    generationInProgressRef.current = true;
    setIsGeneratingQuiz(true);
    setQuizError(null);
    setSelectedAnswer(null);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          lesson: lessonContent,
          difficulty: 'Easy',
          number_of_questions: 1
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate quiz from lesson.');
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
      } else {
        throw new Error('No questions returned for this topic.');
      }
    } catch (err: any) {
      console.error('[Classroom] Quiz generation error:', err);
      setQuizError(err.message || 'Unable to generate quiz. Please retry.');
    } finally {
      setIsGeneratingQuiz(false);
      generationInProgressRef.current = false;
    }
  }, [topicTitle, lessonContent, isGeneratingQuiz]);

  // Transition from Lecture to Assessment
  const handleStartAssessment = () => {
    setPhase('ASSESSMENT');
    if (!currentQuestion) {
      handleGenerateQuiz();
    }
  };

  // Submit Answer to Evaluation API
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || isEvaluating) return;

    setIsEvaluating(true);
    const questionText = currentQuestion.question;
    const studentAnswerText = currentQuestion.options[selectedAnswer] || selectedAnswer;
    const correctAnswerText = currentQuestion.options[currentQuestion.correct_answer] || currentQuestion.correct_answer;

    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          question: questionText,
          correct_answer: correctAnswerText,
          student_answer: studentAnswerText,
          lesson: lessonContent
        })
      });

      if (!res.ok) {
        throw new Error('Evaluation service error.');
      }

      const data = await res.json();
      setEvaluationResult(data.evaluation);
      setReteachContent(data.reteach_content || '');

      let speechContent = data.evaluation?.explanation || '';
      if (data.reteach_content) {
        speechContent += ' ' + data.reteach_content;
      }
      if (speechContent && avatarRef.current) {
        avatarRef.current.speak(speechContent);
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setEvaluationResult({
        result: 'EVALUATION_ERROR',
        score: null,
        explanation: 'There was a connection issue evaluating your answer. Your score was not penalized. Please try again.'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetAnswer = () => {
    setSelectedAnswer(null);
    setEvaluationResult(null);
    setReteachContent('');
  };

  // Voice Interaction ("Raise Hand") Handler
  const handleRaiseHand = async () => {
    if (avatarRef.current) {
      await avatarRef.current.interrupt();
    }

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

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const fallback = `Can you explain how mass and force relate to acceleration in ${topicTitle}?`;
      setDoubtText(fallback);
      await submitDoubtToBackend(fallback);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        if (transcript.trim()) {
          setDoubtText(transcript);
          await submitDoubtToBackend(transcript);
        }
      };
      recognition.onerror = async () => {
        setIsListening(false);
        const fallback = `Can you summarize the core derivation of ${topicTitle}?`;
        setDoubtText(fallback);
        await submitDoubtToBackend(fallback);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const submitDoubtToBackend = async (question: string) => {
    setIsAnalyzingDoubt(true);
    try {
      const res = await fetch('http://localhost:8000/ask_doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          topic: topicTitle,
          lesson: lessonContent,
          language: lang
        }),
        signal: AbortSignal.timeout(4000)
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        const explanation = data.explanation || data.response || 'Let me clarify that concept for you.';
        setDoubtExplanation(explanation);
        avatarRef.current?.speak(explanation);
      } else {
        const fallback = `In ${topicTitle}, always remember that acceleration is directly proportional to applied force and inversely proportional to inertial mass (a = F / m).`;
        setDoubtExplanation(fallback);
        avatarRef.current?.speak(fallback);
      }
    } catch {
      const fallback = `In ${topicTitle}, acceleration is directly governed by applied force divided by mass.`;
      setDoubtExplanation(fallback);
      avatarRef.current?.speak(fallback);
    } finally {
      setIsAnalyzingDoubt(false);
    }
  };

  const isDarkMode = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
      isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Top Classroom Bar */}
      <header className={`sticky top-0 z-50 border-b px-4 sm:px-6 h-16 flex items-center justify-between backdrop-blur-md ${
        isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            href="/studio"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:text-cyan-400 hover:bg-slate-800' 
                : 'border-slate-300 text-slate-700 hover:text-cyan-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:inline">AI Classroom Session</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setPhase('TEACHING')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                phase === 'TEACHING'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>1. AI Lecture</span>
            </button>
            <button
              type="button"
              onClick={handleStartAssessment}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                phase === 'ASSESSMENT'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : videoCompleted
                  ? 'text-cyan-400 hover:text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>2. Diagnostic Quiz</span>
              {videoCompleted && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* ========================================================= */}
      {/* PHASE 1: FULL SCREEN / THEATER AI TEACHING CLASS          */}
      {/* (No parallel quiz clutter! Full focus on the AI Teacher)   */}
      {/* ========================================================= */}
      {phase === 'TEACHING' && (
        <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
          
          {/* Lecture Subheader */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-500">Live Lecture Stage</span>
                <span className="text-xs text-slate-500">&bull;</span>
                <span className="text-xs font-semibold">{topicTitle}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-screen interactive session with Dr. Alex. Watch the derivation lecture before proceeding to your assessment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTheaterFullscreen(!isTheaterFullscreen)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                title={isTheaterFullscreen ? 'Standard View' : 'Expand Theater'}
              >
                {isTheaterFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isTheaterFullscreen ? 'Exit Theater' : 'Theater View'}</span>
              </button>

              <button
                type="button"
                id="complete-lecture-button"
                onClick={handleStartAssessment}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Complete Lesson & Take Quiz</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Full-Width Teaching Theater Stage */}
          <div 
            ref={stageRef}
            className={`w-full flex-1 rounded-2xl border overflow-hidden shadow-2xl relative transition-all duration-300 flex flex-col ${
              isTheaterFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[520px]'
            } ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-200'
            }`}
          >
            {/* Live Avatar Player Stage (Takes Full Screen Height) */}
            <div className="flex-1 relative flex flex-col">
              <LiveAvatar
                ref={avatarRef}
                autoStart={false}
                avatarBackendUrl="http://localhost:3001"
                voiceId={voiceIdParam}
                language={lang}
                educatorName="Dr. Alex"
                educatorTitle="Lead AI Physics Educator"
                videoSrc={videoUrlParam}
                teachingLesson={lessonContent}
                statusOverlay={
                  isListening
                    ? "Listening to your doubt..."
                    : isAnalyzingDoubt
                    ? "Analyzing doubt with Gemini..."
                    : null
                }
                onStatusChange={(status) => setAvatarStatus(status)}
                onVideoProgress={handleVideoProgress}
                onVideoCompleted={handleVideoCompleted}
                className="w-full h-full flex-1"
              />

              {/* Theater Mode Exit Header Overlay */}
              {isTheaterFullscreen && (
                <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTheaterFullscreen(false)}
                    className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Exit Fullscreen</span>
                  </button>
                </div>
              )}

              {/* Spoken Doubt Overlay Pill */}
              {(doubtText || doubtExplanation) && (
                <div className="absolute bottom-20 left-4 right-4 max-w-2xl mx-auto z-30 p-3.5 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-500/40 text-xs shadow-2xl animate-scaleIn">
                  {doubtText && (
                    <div className="flex items-start gap-2 mb-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-200 font-medium">
                        Student Doubt: &ldquo;{doubtText}&rdquo;
                      </p>
                    </div>
                  )}
                  {doubtExplanation && (
                    <div className="flex items-start gap-2 pt-1.5 border-t border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <p className="text-slate-100 leading-relaxed">
                        {doubtExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Teaching Control & Derivation HUD */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
              
              {/* Left: Raise Hand Voice Doubt Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="raise-hand-button"
                  onClick={handleRaiseHand}
                  disabled={!isSpeechSupported || isAnalyzingDoubt}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30'
                      : isAnalyzingDoubt
                      ? 'bg-amber-600 text-white opacity-80 cursor-wait'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-[0.98]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-4 h-4 animate-bounce" />
                      <span>Listening... (Click to Finish)</span>
                    </>
                  ) : isAnalyzingDoubt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing doubt...</span>
                    </>
                  ) : (
                    <>
                      <Hand className="w-4 h-4" />
                      <span>Raise Hand &bull; Ask Question</span>
                    </>
                  )}
                </button>

                <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 pl-2 font-mono">
                  <span className="text-cyan-400 font-bold">Derivation:</span>
                  <span>F_net = m &middot; a &rArr; a = F / m</span>
                </div>
              </div>

              {/* Right: Watch Progress & Start Quiz CTA */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <div className="flex justify-between w-36 text-[10px] text-slate-400">
                    <span>Lesson Progress</span>
                    <span className="font-bold text-cyan-400">{videoProgress}%</span>
                  </div>
                  <div className="w-36 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartAssessment}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                >
                  <Brain className="w-4 h-4" />
                  <span>Start Socratic Quiz &rarr;</span>
                </button>
              </div>

            </div>
          </div>

          {/* Mathematical Whiteboard & Notes Drawer */}
          <div className={`mt-5 p-5 rounded-2xl border transition-colors ${
            isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-500">Live Mathematical Blackboard & Transcript</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Grounded in: {topicTitle}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono space-y-1.5">
                <div className="text-[11px] font-bold text-cyan-400">Core Equation Derivation</div>
                <div className="text-lg font-bold text-white tracking-wide">
                  \mathbf&#123;a&#125; = \frac&#123;\mathbf&#123;F&#125;_\text&#123;net&#125;&#125;&#123;m&#125;
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Acceleration vector points in the direction of the net force vector. When mass is held invariant, acceleration scales linearly with force.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-bold text-blue-400">Key Takeaway for Quiz</div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {lessonContent ? lessonContent.slice(0, 220) + '...' : `Master the fundamental proportional relationships of ${topicTitle}. Once you complete this lecture, your diagnostic quiz will directly test these derivations.`}
                </p>
              </div>
            </div>
          </div>

        </main>
      )}

      {/* ========================================================= */}
      {/* PHASE 2: FOCUSED ASSESSMENT / QUIZ MODE                  */}
      {/* (Only conducted AFTER lesson completion / user transition) */}
      {/* ========================================================= */}
      {phase === 'ASSESSMENT' && (
        <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full animate-fadeIn">
          
          {/* Assessment Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPhase('TEACHING')}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                isDarkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AI Lecture</span>
            </button>

            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 block">
                Socratic Diagnostic Assessment
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Testing Mastery on: <strong className="text-slate-200">{topicTitle}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isDarkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              title="Generate New Question"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingQuiz ? 'animate-spin text-cyan-500' : ''}`} />
              <span className="hidden sm:inline">New Question</span>
            </button>
          </div>

          {/* Assessment Stage Card */}
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-6 ${
            isDarkMode 
              ? 'bg-slate-900/90 border-slate-800 shadow-cyan-500/5' 
              : 'bg-white border-slate-200 shadow-xl'
          }`}>

            {/* Loading State for Quiz */}
            {isGeneratingQuiz && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse">
                  <Brain className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">AI Teacher is Formulating Your Diagnostic Quiz</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Synthesizing questions strictly grounded in &ldquo;{topicTitle}&rdquo; and your lecture notes...
                  </p>
                </div>
                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
              </div>
            )}

            {/* Quiz Error Banner */}
            {quizError && !isGeneratingQuiz && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Quiz Generation Issue</div>
                  <p>{quizError}</p>
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-rose-900/50 hover:bg-rose-900/70 text-rose-200 text-xs font-semibold border border-rose-700/60 cursor-pointer"
                  >
                    Retry Generating Question
                  </button>
                </div>
              </div>
            )}

            {/* Active Question & Socratic Multiple-Choice Section */}
            {currentQuestion && !isGeneratingQuiz && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Question Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      Question 1 of 1 &bull; Single Choice
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Grounded in: <strong>{topicTitle}</strong>
                    </span>
                  </div>

                  <h3 className={`text-base sm:text-lg font-bold leading-relaxed ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Multiple Choice Options Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = selectedAnswer === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        id={`quiz-option-${key}`}
                        onClick={() => {
                          setSelectedAnswer(key);
                          if (evaluationResult) {
                            setEvaluationResult(null);
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-cyan-500/15 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-500/10'
                              : 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-1 ring-cyan-500/50 shadow-sm'
                            : isDarkMode
                            ? 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : isDarkMode
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {key}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-normal pt-0.5">
                          {value as string}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-400">
                    {selectedAnswer 
                      ? `Selected option [${selectedAnswer}]. Ready to evaluate.` 
                      : 'Select the most accurate derivation option above.'}
                  </span>

                  <div className="flex items-center gap-2">
                    {evaluationResult && (
                      <button
                        type="button"
                        id="reset-answer-button"
                        onClick={handleResetAnswer}
                        className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear Selection</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="submit-answer-btn"
                      disabled={!selectedAnswer || isEvaluating}
                      onClick={handleSubmitAnswer}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Dr. Alex is Evaluating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Answer to AI Teacher</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Socratic Feedback Breakdown */}
                {evaluationResult && (
                  <div className="space-y-4 pt-3 animate-fadeIn">
                    
                    {/* Result Banner */}
                    <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                      evaluationResult.result === 'CORRECT'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    }`}>
                      {evaluationResult.result === 'CORRECT' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      )}

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">
                            {evaluationResult.result === 'CORRECT' ? 'Mastery Confirmed!' : 'Review Recommended'}
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/30">
                            Score: {evaluationResult.score ?? 0}%
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200">
                          {evaluationResult.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Misconception & Targeted Reteach Card (If Incorrect) */}
                    {evaluationResult.result !== 'CORRECT' && (
                      <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-xs space-y-2.5 animate-fadeIn">
                        <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Socratic Misconception Diagnosis</span>
                        </div>

                        {evaluationResult.misconception && (
                          <p className="text-slate-300 pl-6 leading-relaxed">
                            <strong>Diagnostic Analysis:</strong> {evaluationResult.misconception}
                          </p>
                        )}

                        <div className="text-slate-200 pl-6 bg-rose-950/40 p-3 rounded-xl border border-rose-800/40 leading-relaxed">
                          <strong className="text-rose-300 block mb-1">Targeted AI Reteach:</strong>
                          <span>{reteachContent || 'Remember: In this topic, direct proportionality governs that as net force increases, acceleration increases proportionally.'}</span>
                        </div>
                      </div>
                    )}

                    {/* Next Steps CTA */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setPhase('TEACHING')}
                        className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
                      >
                        Review Lecture & Derivations
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateQuiz}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>

        </main>
      )}

    </div>
  );
}

export default function ClassroomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-sm text-cyan-400 font-mono">
        Loading AI Classroom...
      </div>
    }>
      <ClassroomContent />
    </Suspense>
  );
}
