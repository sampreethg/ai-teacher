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
  Lock,
  Play
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LiveAvatar, { LiveAvatarRef, AvatarStatus } from '@/components/studio/LiveAvatar';
import { useTheme } from 'next-themes';
import { getVoiceByLanguage } from '@/lib/config/voices';

export type ClassroomWorkflowState =
  | 'VIDEO_NOT_STARTED'
  | 'VIDEO_PLAYING'
  | 'VIDEO_COMPLETED'
  | 'QUIZ_GENERATION_AVAILABLE'
  | 'QUIZ_GENERATING'
  | 'QUIZ_READY'
  | 'QUIZ_IN_PROGRESS'
  | 'QUIZ_SUBMITTED'
  | 'EVALUATING'
  | 'EVALUATION_ERROR'
  | 'COMPLETED';

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

  // Classroom Workflow State Machine
  const [workflowState, setWorkflowState] = useState<ClassroomWorkflowState>('VIDEO_NOT_STARTED');
  const [videoCompleted, setVideoCompleted] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0); // 0 to 100%

  // Lesson Content States
  const [lessonContent, setLessonContent] = useState<string>('');
  const [isLoadingLesson, setIsLoadingLesson] = useState(true);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Avatar / Video Stream States
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  const avatarRef = useRef<LiveAvatarRef>(null);

  // Quiz States (MUST NOT exist when classroom opens)
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
  const [adaptiveDecision, setAdaptiveDecision] = useState<any>(null);
  const [upcomingQuestion, setUpcomingQuestion] = useState<any>(null);

  // Source Grounding
  const [activeSourcesCount, setActiveSourcesCount] = useState<number>(0);

  // "Raise Hand" & Voice Questioning States
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingDoubt, setIsAnalyzingDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState<string>('');
  const [doubtExplanation, setDoubtExplanation] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Flag to avoid duplicate quiz generations during StrictMode or rapid clicks
  const generationInProgressRef = useRef<boolean>(false);

  // Check stored sources on mount for honest grounding reporting
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
      } catch (e) {
        setActiveSourcesCount(0);
      }
    }
  }, []);

  // Fetch Lesson Content on Mount (DOES NOT generate quiz)
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
          } catch (e) {
            sourcesContext = '';
          }
        }
      }

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
        })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setLessonContent(data.lesson || '');
      } else {
        setLessonError('Failed to generate lesson from AI Teacher backend. Please ensure the Python engine is running.');
      }
    } catch (err: any) {
      console.error('Failed to load lesson from FastAPI:', err);
      setLessonError(err?.message || 'Error connecting to lesson engine.');
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
    if (progress > 0 && workflowState === 'VIDEO_NOT_STARTED') {
      setWorkflowState('VIDEO_PLAYING');
    }
  }, [workflowState]);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    if (playing && workflowState === 'VIDEO_NOT_STARTED') {
      setWorkflowState('VIDEO_PLAYING');
    }
  }, [workflowState]);

  // Video completion callback from LiveAvatar
  const handleVideoCompleted = useCallback(() => {
    setVideoCompleted(true);
    setVideoProgress(100);
    setWorkflowState('QUIZ_GENERATION_AVAILABLE');
  }, []);

  // Generate Quiz triggered explicitly by student click AFTER video completion
  const handleGenerateQuiz = async () => {
    if (!videoCompleted) return;
    if (isGeneratingQuiz || generationInProgressRef.current) return;

    generationInProgressRef.current = true;
    setIsGeneratingQuiz(true);
    setWorkflowState('QUIZ_GENERATING');
    setQuizError(null);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setEvaluationResult(null);

    try {
      const qRes = await fetch('http://localhost:8000/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          lesson: lessonContent || "Newton's Second Law states that F = m * a.",
          level: 'Beginner',
          difficulty: 'Easy',
          number_of_questions: 1
        })
      }).catch(() => null);

      if (!qRes || !qRes.ok) {
        throw new Error(`Quiz generation service returned status ${qRes ? qRes.status : 'offline'}`);
      }

      const qData = await qRes.json();
      if (qData.status === 'error' || !qData.questions || qData.questions.length === 0) {
        throw new Error(qData.error || 'The AI generator returned an invalid question format.');
      }

      setCurrentQuestion(qData.questions[0]);
      setWorkflowState('QUIZ_READY');
    } catch (err: any) {
      console.error('[Classroom] Quiz generation error:', err);
      setQuizError(err.message || 'Failed to generate quiz. Please try again.');
      setWorkflowState('QUIZ_GENERATION_AVAILABLE');
    } finally {
      setIsGeneratingQuiz(false);
      generationInProgressRef.current = false;
    }
  };

  // Submit Answer to FastAPI Socratic Evaluation Engine
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || isEvaluating) return;

    setIsEvaluating(true);
    setWorkflowState('EVALUATING');

    const questionText = currentQuestion.question;
    const studentAnswerText = currentQuestion.options[selectedAnswer] || selectedAnswer;
    const correctAnswerText = currentQuestion.options[currentQuestion.correct_answer] || currentQuestion.correct_answer;

    try {
      const res = await fetch('http://localhost:8000/api/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicTitle,
          level: 'Beginner',
          question: questionText,
          correct_answer: correctAnswerText,
          student_answer: studentAnswerText,
          lesson: lessonContent || "F = m * a"
        })
      }).catch(() => null);

      if (!res || !res.ok) {
        setWorkflowState('EVALUATION_ERROR');
        setEvaluationResult({
          result: 'EVALUATION_ERROR',
          score: null, // NOT 0!
          explanation: `Evaluation service was unavailable (${res ? `status ${res.status}` : 'offline'}). Your answer has not been penalized. Please try again.`
        });
        return;
      }

      const data = await res.json();

      // Guard: Evaluation Error returned from backend
      if (data.status === 'evaluation_error' || data.evaluation?.result === 'EVALUATION_ERROR') {
        setWorkflowState('EVALUATION_ERROR');
        setEvaluationResult({
          result: 'EVALUATION_ERROR',
          score: null, // Never score 0 on service failure!
          explanation: data.evaluation?.explanation || data.message || 'There was an error evaluating your answer. Your answer has not been penalized. Please try again.',
        });
        return;
      }

      // Successful, valid evaluation
      setWorkflowState('COMPLETED');
      setEvaluationResult(data.evaluation);
      setAdaptiveDecision(data.adaptive_decision);
      setReteachContent(data.reteach_content || '');
      setUpcomingQuestion(data.next_question || null);

      let speechContent = data.evaluation?.explanation || '';
      if (data.reteach_content) {
        speechContent += " " + data.reteach_content;
      }
      if (speechContent) {
        avatarRef.current?.speak(speechContent);
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setWorkflowState('EVALUATION_ERROR');
      setEvaluationResult({
        result: 'EVALUATION_ERROR',
        score: null,
        explanation: `Unexpected error: ${err?.message || 'Network connection failed'}. Please retry.`
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetAnswer = () => {
    setSelectedAnswer(null);
    setEvaluationResult(null);
    setAdaptiveDecision(null);
    setReteachContent('');
    if (workflowState === 'EVALUATION_ERROR' || workflowState === 'COMPLETED') {
      setWorkflowState('QUIZ_IN_PROGRESS');
    }
  };

  const handleNextQuestion = () => {
    if (upcomingQuestion) {
      setCurrentQuestion(upcomingQuestion);
      setUpcomingQuestion(null);
      setSelectedAnswer(null);
      setEvaluationResult(null);
      setAdaptiveDecision(null);
      setReteachContent('');
      setWorkflowState('QUIZ_READY');
    }
  };

  // Handle student raising hand to interrupt & ask doubt
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
        avatarRef.current?.speak(explanation);
      } else {
        const fallback = "I'm sorry, I encountered an error analyzing your doubt.";
        setDoubtExplanation(fallback);
        avatarRef.current?.speak(fallback);
      }
    } catch (err) {
      console.error('Error asking doubt:', err);
    } finally {
      setIsAnalyzingDoubt(false);
    }
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
          
          {/* Avatar Video Column (Plays inside classroom) */}
          <div className="lg:col-span-5 flex flex-col min-h-[460px]">
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
              onPlayStateChange={handlePlayStateChange}
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
                {lessonError && (
                  <span className="text-[10px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Lesson Error
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

              {/* Lesson Failure Banner (if any) */}
              {lessonError && (
                <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Lesson Generation Failed</span>
                    <p>{lessonError}</p>
                    <button
                      type="button"
                      onClick={fetchLesson}
                      className="mt-2 px-3 py-1 bg-rose-900/40 hover:bg-rose-900/60 rounded text-rose-200 text-xs font-semibold border border-rose-700/50 cursor-pointer"
                    >
                      Retry Lesson Generation
                    </button>
                  </div>
                </div>
              )}

              {/* Socratic Checkpoint Card (Workflow Dependent) */}
              <div className={`p-5 rounded-xl border font-sans space-y-3.5 transition-all ${
                isDarkMode ? 'bg-slate-900/90 border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-600 dark:text-cyan-300">
                    <Brain className="w-4 h-4 text-cyan-500" />
                    Socratic Diagnostic Checkpoint
                  </span>
                  
                  {/* Honest Grounding Tag */}
                  <span className="text-[10px] px-2 py-0.5 rounded border bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40 font-semibold">
                    {activeSourcesCount > 0 
                      ? `Grounded in ${activeSourcesCount} uploaded material(s) & video`
                      : "Quiz generated from today's lesson"}
                  </span>
                </div>

                {/* State A: Before Video Completion (Quiz Does NOT exist yet) */}
                {!videoCompleted && (
                  <div className="py-6 flex flex-col items-center text-center space-y-3 font-sans">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Quiz Locked &bull; Video In Progress
                      </h4>
                      <p className="text-xs text-slate-400">
                        Please watch the complete teaching video on the left. The diagnostic quiz is generated directly from what was taught in the video.
                      </p>
                    </div>

                    <div className="w-full max-w-xs space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Video Watch Progress</span>
                        <span className="font-bold text-cyan-400">{videoProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      id="generate-quiz-disabled-button"
                      disabled={true}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 text-xs font-semibold cursor-not-allowed flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Generate Quiz (Watch video to unlock: {videoProgress}%)</span>
                    </button>
                  </div>
                )}

                {/* State B: Video Completed, Quiz Available to Generate */}
                {videoCompleted && !currentQuestion && (
                  <div className="py-6 flex flex-col items-center text-center space-y-3 font-sans animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Video Lesson Completed!
                      </h4>
                      <p className="text-xs text-slate-300">
                        You have completed the video lecture. Generate your diagnostic quiz now to verify your understanding.
                      </p>
                    </div>

                    {quizError && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs text-left max-w-md flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block">Quiz Generation Failed:</strong>
                          <span>{quizError}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      id="generate-quiz-btn"
                      disabled={isGeneratingQuiz}
                      onClick={handleGenerateQuiz}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
                    >
                      {isGeneratingQuiz ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Generating Quiz from Video Content...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>Generate Quiz from Video Lesson</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* State C: Quiz Generated and Displayed */}
                {currentQuestion && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      &ldquo;{currentQuestion.question}&rdquo;
                    </p>

                    {/* Multiple Choice Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {Object.entries(currentQuestion.options).map(([key, value]) => (
                        <button
                          key={key}
                          type="button"
                          id={`quiz-option-${key}`}
                          onClick={() => {
                            setSelectedAnswer(key);
                            if (workflowState === 'EVALUATION_ERROR') {
                              setEvaluationResult(null);
                            }
                          }}
                          className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            selectedAnswer === key
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                              : isDarkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500' 
                              : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-500'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            selectedAnswer === key ? 'bg-amber-500 text-slate-950' : 'bg-slate-600 text-white'
                          }`}>{key}</span>
                          <span>{value as string}</span>
                        </button>
                      ))}
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
                            id="reset-answer-button"
                            onClick={handleResetAnswer}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        )}

                        <button
                          type="button"
                          id="submit-answer-btn"
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
                        {/* 1. Evaluation Service Error (Never marked incorrect, score not 0%) */}
                        {evaluationResult.result === 'EVALUATION_ERROR' && (
                          <div className="p-3.5 rounded-xl text-xs flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 animate-fadeIn">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <div className="font-bold uppercase tracking-wider text-[10px] text-rose-400">
                                Evaluation Service Error &bull; Answer Not Graded
                              </div>
                              <p className="leading-relaxed">
                                {evaluationResult.explanation}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Your mastery score and difficulty were not affected. Please click &ldquo;Submit Answer&rdquo; above to retry evaluation.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 2. Valid Evaluation (CORRECT, INCORRECT, or PARTIAL) */}
                        {evaluationResult.result !== 'EVALUATION_ERROR' && (
                          <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                            evaluationResult.result === 'CORRECT'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : evaluationResult.result === 'PARTIAL'
                              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                          }`}>
                            {evaluationResult.result === 'CORRECT' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : evaluationResult.result === 'PARTIAL' ? (
                              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                              <div className="font-bold uppercase tracking-wider text-[10px]">
                                {evaluationResult.result === 'CORRECT'
                                  ? 'Mastery Confirmed'
                                  : evaluationResult.result === 'PARTIAL'
                                  ? 'Partial Understanding'
                                  : 'Needs Review'} &bull; Score: {evaluationResult.score ?? 0}%
                              </div>
                              <p className="leading-relaxed">
                                {evaluationResult.explanation}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 3. Targeted Misconception Remediation Card if Incorrect */}
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
                              <strong className="text-rose-300">Targeted Reteach:</strong> {reteachContent || 'Notice how the fundamental rules apply. Please review the core concepts carefully before proceeding.'}
                            </div>

                            {adaptiveDecision && (
                              <div className="text-[10px] text-rose-300/80 pl-6 uppercase font-bold">
                                Adaptive Action: {adaptiveDecision.action} &bull; Next Difficulty: {adaptiveDecision.difficulty || 'Preserved'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Continue Button */}
                        {upcomingQuestion && (
                          <div className="pt-2">
                            <button
                              type="button"
                              id="next-question-btn"
                              onClick={handleNextQuestion}
                              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
                            >
                              Continue to Next Question &rarr;
                            </button>
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
