'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback
} from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  AlertCircle,
  GraduationCap,
  RefreshCw,
  Radio,
  CheckCircle2
} from 'lucide-react';

export type AvatarStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error';

export interface LiveAvatarRef {
  speak: (text: string) => void;
  interrupt: () => Promise<void>;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
  mute: (value: boolean) => Promise<void>;
  playVideo: () => Promise<void>;
  pauseVideo: () => void;
}

export interface LiveAvatarProps {
  autoStart?: boolean;
  avatarBackendUrl?: string;
  voiceId?: string;
  language?: string;
  onStatusChange?: (status: AvatarStatus) => void;
  className?: string;
  educatorName?: string;
  educatorTitle?: string;
  statusOverlay?: string | null;
  videoSrc?: string;
  teachingLesson?: string;
  onVideoProgress?: (progress: number, currentTime: number, duration: number) => void;
  onVideoCompleted?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const LiveAvatar = forwardRef<LiveAvatarRef, LiveAvatarProps>(function LiveAvatar(
  {
    autoStart = false,
    avatarBackendUrl = 'http://localhost:3001',
    voiceId,
    language,
    onStatusChange,
    className = '',
    educatorName = 'Dr. Alex',
    educatorTitle = 'Lead AI Physics Educator',
    statusOverlay = null,
    videoSrc,
    teachingLesson = '',
    onVideoProgress,
    onVideoCompleted,
    onPlayStateChange
  },
  ref
) {
  const [status, setStatus] = useState<AvatarStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Video Playback & Tracking States
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100%
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [videoDuration, setVideoDuration] = useState(25); // dynamic lesson duration
  const [hasCompleted, setHasCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const progressTimerRef = useRef<any>(null);
  const speechUttRef = useRef<any>(null);

  // Active playback state refs to prevent background timer progress or premature completion
  const isPlayingRef = useRef<boolean>(false);
  const accumulatedTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const speechActiveRef = useRef<boolean>(false);
  const speechCompletedRef = useRef<boolean>(false);

  const updateStatus = useCallback((newStatus: AvatarStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Clean up canvas animation & media streams
  const cleanupVideoStream = useCallback(() => {
    isPlayingRef.current = false;
    lastTickRef.current = 0;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger actual video / lesson completion ONLY when playback actually reaches the end
  const triggerActualCompletion = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    isPlayingRef.current = false;
    setHasCompleted(true);
    setIsPlaying(false);
    setVideoProgress(100);
    setCurrentTime(videoDuration);
    cleanupVideoStream();
    onVideoProgress?.(100, videoDuration, videoDuration);
    onVideoCompleted?.();
    onPlayStateChange?.(false);
  }, [videoDuration, cleanupVideoStream, onVideoProgress, onVideoCompleted, onPlayStateChange]);

  // Generate an interactive HTML5 Canvas teaching video stream if WebRTC is not active
  const startInteractiveTeachingCanvas = useCallback((lessonText: string, targetDuration: number = 25) => {
    if (typeof window === 'undefined') return;

    cleanupVideoStream();

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let mouthOpen = 0;
    lastTickRef.current = performance.now();
    isPlayingRef.current = true;

    // Canvas drawing loop with real active-tick accumulation
    const renderFrame = () => {
      if (!isPlayingRef.current) return;

      frameCount++;
      const now = performance.now();
      if (lastTickRef.current > 0) {
        const deltaSec = (now - lastTickRef.current) / 1000;
        accumulatedTimeRef.current = Math.min(accumulatedTimeRef.current + deltaSec, targetDuration);
      }
      lastTickRef.current = now;

      const curSec = accumulatedTimeRef.current;
      const progressRatio = targetDuration > 0 ? Math.min(curSec / targetDuration, 1) : 0;
      const progressPercent = Math.min(Math.round(progressRatio * 100), 100);

      setCurrentTime(curSec);
      setVideoProgress(progressPercent);
      onVideoProgress?.(progressPercent, curSec, targetDuration);

      // 1. Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 640, 360);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 640, 360);

      // Grid effect
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 360);
        ctx.stroke();
      }
      for (let y = 0; y < 360; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // 2. Avatar representation (Dr. Alex visual silhouette & face)
      const centerX = 160;
      const centerY = 190;
      const headBob = Math.sin(frameCount * 0.08) * 4;

      // Glow circle
      const auraGrad = ctx.createRadialGradient(centerX, centerY + headBob, 10, centerX, centerY + headBob, 90);
      auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY + headBob, 90, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders / torso
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + headBob + 95, 75, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(centerX, centerY + headBob, 50, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX - 18, centerY + headBob - 8, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 18, centerY + headBob - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Mouth speaking animation
      mouthOpen = Math.abs(Math.sin(frameCount * 0.25)) * 9;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + headBob + 18, 12, Math.max(3, mouthOpen), 0, 0, Math.PI * 2);
      ctx.fill();

      // Teacher Name Badge
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(educatorName, centerX, centerY + headBob + 145);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('LIVE AI LECTURE', centerX, centerY + headBob + 160);

      // 3. Right side: Dynamic Whiteboard Derivation Chalkboard
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(290, 30, 320, 290, 12);
      ctx.fill();
      ctx.stroke();

      // Chalkboard Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DERIVATION & LECTURE NOTES', 308, 62);

      // Core formula highlight
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('F_net = m · a', 308, 102);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '13px monospace';
      ctx.fillText('⇒ a = F_net / m', 308, 130);

      // Lesson snippet text rendering
      const previewLines = [
        '1. Force is directly proportional to acceleration.',
        '2. Inertial mass resists state changes.',
        '3. If mass doubles at constant force,',
        '   acceleration is halved (a ∝ 1/m).'
      ];

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      previewLines.forEach((line, idx) => {
        ctx.fillText(line, 308, 168 + idx * 22);
      });

      // Audio Frequency waves inside video
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 30; i++) {
        const waveX = 308 + i * 9.5;
        const waveY = 275 + Math.sin(frameCount * 0.2 + i * 0.5) * 6;
        if (i === 0) ctx.moveTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.stroke();

      // Live Watermark
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.arc(32, 28, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('REC • AI LECTURE STREAM', 45, 32);

      const speechFinished = !speechActiveRef.current || speechCompletedRef.current;
      if (progressRatio < 1 || !speechFinished) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        // ACTUAL VIDEO/LESSON FINISHED: Trigger actual completion
        triggerActualCompletion();
      }
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);

    // Capture media stream and attach to video element
    try {
      const stream = canvas.captureStream(30);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('[LiveAvatar] Canvas captureStream error:', e);
    }

    // Play narration speech in parallel using Web Speech API if supported
    if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speechText = lessonText ? lessonText.slice(0, 300) : "Welcome to this interactive video lecture. Let us derive Newton's second law.";
        const utt = new SpeechSynthesisUtterance(speechText);
        utt.rate = 1.0;
        speechUttRef.current = utt;
        speechActiveRef.current = true;
        speechCompletedRef.current = false;
        utt.onend = () => {
          speechCompletedRef.current = true;
        };
        utt.onerror = () => {
          speechCompletedRef.current = true;
        };
        window.speechSynthesis.speak(utt);
      } catch (e) {
        console.warn('SpeechSynthesis error:', e);
        speechActiveRef.current = false;
        speechCompletedRef.current = true;
      }
    } else {
      speechActiveRef.current = false;
      speechCompletedRef.current = true;
    }
  }, [educatorName, isMuted, triggerActualCompletion, cleanupVideoStream]);

  const startSession = async (): Promise<boolean> => {
    try {
      setErrorMessage(null);
      updateStatus('connecting');

      // Check for custom videoSrc if provided
      if (videoSrc && videoRef.current) {
        videoRef.current.src = videoSrc;
        videoRef.current.srcObject = null;
        await videoRef.current.play().catch(() => {});
        setIsPlaying(true);
        updateStatus('connected');
        onPlayStateChange?.(true);
        return true;
      }

      // 1. Fetch token from Express Avatar Backend (Port 3001) or Next.js /api/avatar route
      const tokenEndpoint = `${avatarBackendUrl}/api/avatar/session`;
      let tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voice_id: voiceId,
          language: language,
        })
      }).catch(() => null);

      if (!tokenRes || !tokenRes.ok) {
        const fallbackRes = await fetch('/api/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            voice_id: voiceId,
            language: language,
          })
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          tokenRes = fallbackRes;
        }
      }

      if (tokenRes && tokenRes.ok) {
        const sessionData = await tokenRes.json();
        const sessionToken = sessionData.session_token;

        if (sessionToken) {
          const {
            LiveAvatarSession,
            SessionEvent,
            SessionState,
            AgentEventsEnum
          } = await import('@heygen/liveavatar-web-sdk');

          const session = new LiveAvatarSession(sessionToken, { voiceChat: true });
          sessionRef.current = session;

          session.on(SessionEvent.SESSION_STATE_CHANGED, (state: any) => {
            if (state === SessionState.CONNECTED) updateStatus('connected');
            if (state === SessionState.DISCONNECTED) updateStatus('idle');
          });

          session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
            updateStatus('speaking');
          });

          session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
            updateStatus('connected');
            setSpeakingText(null);
            // NOTE: Avatar finishing an individual sentence does NOT mark the lesson complete.
            // Lesson completion is strictly determined by the full lecture track reaching the end.
          });

          session.on(SessionEvent.SESSION_DISCONNECTED, () => {
            updateStatus('idle');
          });

          await session.start();

          if (videoRef.current) {
            session.attach(videoRef.current);
          }

          updateStatus('connected');
          setIsPlaying(true);
          isPlayingRef.current = true;
          onPlayStateChange?.(true);
          return true;
        }
      }

      // Fallback: Start Interactive Teaching Video Lecture Canvas
      setIsSimulating(true);
      updateStatus('connected');
      setIsPlaying(true);
      isPlayingRef.current = true;
      onPlayStateChange?.(true);
      startInteractiveTeachingCanvas(teachingLesson, videoDuration);
      return true;
    } catch (err: any) {
      console.warn('[LiveAvatar] Starting interactive fallback video canvas:', err);
      setIsSimulating(true);
      updateStatus('connected');
      setIsPlaying(true);
      isPlayingRef.current = true;
      onPlayStateChange?.(true);
      startInteractiveTeachingCanvas(teachingLesson, videoDuration);
      return true;
    }
  };

  const stopSession = async () => {
    try {
      cleanupVideoStream();
      setIsPlaying(false);
      isPlayingRef.current = false;
      onPlayStateChange?.(false);
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
    } catch (e) {
      console.error('[LiveAvatar] Error stopping session:', e);
    } finally {
      updateStatus('idle');
      setSpeakingText(null);
    }
  };

  const playVideo = async () => {
    if (hasCompletedRef.current) return;
    if (!isPlayingRef.current) {
      if (status === 'idle') {
        await startSession();
      } else {
        isPlayingRef.current = true;
        setIsPlaying(true);
        onPlayStateChange?.(true);
        lastTickRef.current = performance.now();
        if (videoRef.current) {
          await videoRef.current.play().catch(() => {});
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
        if (isSimulating && !animFrameRef.current) {
          startInteractiveTeachingCanvas(teachingLesson, videoDuration);
        }
      }
    }
  };

  const pauseVideo = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    onPlayStateChange?.(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    lastTickRef.current = 0;
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  };

  const handleRestartVideo = () => {
    cleanupVideoStream();
    hasCompletedRef.current = false;
    setHasCompleted(false);
    accumulatedTimeRef.current = 0;
    lastTickRef.current = 0;
    speechCompletedRef.current = false;
    setCurrentTime(0);
    setVideoProgress(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
    onPlayStateChange?.(true);
    startInteractiveTeachingCanvas(teachingLesson, videoDuration);
  };

  const speak = (text: string) => {
    if (!text?.trim()) return;
    setSpeakingText(text);

    if (!isSimulating && sessionRef.current && (status === 'connected' || status === 'speaking')) {
      try {
        sessionRef.current.message(text);
      } catch (err) {
        console.error('[LiveAvatar] Error sending speech to avatar:', err);
      }
    } else {
      setIsSimulating(true);
      updateStatus('speaking');
      const durationMs = Math.min(Math.max(text.length * 60, 3000), 10000);
      setTimeout(() => {
        updateStatus('connected');
        setSpeakingText(null);
      }, durationMs);
    }
  };

  const toggleMute = async () => {
    const nextMuted = !isMuted;
    if (sessionRef.current?.voiceChat) {
      try {
        if (nextMuted) {
          await sessionRef.current.voiceChat.mute();
        } else {
          await sessionRef.current.voiceChat.unmute();
        }
      } catch (err) {
        console.error('[LiveAvatar] Error toggling mute:', err);
      }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (nextMuted) window.speechSynthesis.cancel();
    }
    setIsMuted(nextMuted);
  };

  const interrupt = async () => {
    setSpeakingText(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (sessionRef.current) {
      try {
        if (typeof sessionRef.current.interrupt === 'function') {
          await sessionRef.current.interrupt();
        } else if (typeof sessionRef.current.stopTalking === 'function') {
          await sessionRef.current.stopTalking();
        }
      } catch (err) {
        console.warn('[LiveAvatar] Error interrupting speech:', err);
      }
    }
    updateStatus(sessionRef.current ? 'connected' : 'idle');
  };

  useImperativeHandle(ref, () => ({
    speak,
    interrupt,
    start: startSession,
    stop: stopSession,
    playVideo,
    pauseVideo,
    mute: async (val: boolean) => {
      setIsMuted(val);
    }
  }));

  useEffect(() => {
    if (autoStart) {
      void startSession();
    }
    return () => {
      cleanupVideoStream();
      if (sessionRef.current) {
        sessionRef.current.stop().catch(() => {});
      }
    };
  }, [autoStart, cleanupVideoStream]);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-slate-100 shadow-xl ${className}`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-center z-10 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isPlaying
                ? 'bg-emerald-400 animate-pulse'
                : status === 'connected'
                ? 'bg-cyan-400'
                : status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-semibold tracking-wide">
            {educatorName} &bull; {educatorTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasCompleted && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}

          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video & Stream Canvas Area */}
      <div className="relative my-auto py-2 flex flex-col items-center justify-center min-h-[260px] bg-black/60 rounded-xl overflow-hidden border border-slate-800/80">
        {/* Status Feedback Overlay */}
        {statusOverlay && (
          <div className="absolute top-2 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-200 shadow-2xl animate-fadeIn z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-white tracking-wide">{statusOverlay}</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        )}

        {/* HTML5 Video Element (plays live WebRTC or interactive media stream) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full max-h-[280px] rounded-xl object-contain bg-black/80 transition-opacity duration-300 ${
            status === 'connected' || isPlaying ? 'opacity-100 block' : 'hidden'
          }`}
          onTimeUpdate={() => {
            if (videoSrc && videoRef.current) {
              const cur = videoRef.current.currentTime;
              const dur = videoRef.current.duration || videoDuration;
              if (dur > 0) {
                const prog = Math.min(Math.round((cur / dur) * 100), 100);
                setCurrentTime(cur);
                setVideoProgress(prog);
                onVideoProgress?.(prog, cur, dur);
              }
            }
          }}
          onEnded={() => {
            triggerActualCompletion();
          }}
        />

        {/* Idle / Not-Started Classroom Screen */}
        {status !== 'connected' && !isPlaying && (
          <div className="my-auto text-center z-10 py-6 flex flex-col items-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-1 shadow-2xl mb-4 relative">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <GraduationCap className="w-14 h-14 text-cyan-400 animate-float" />
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-sm leading-relaxed px-4 font-medium">
              Click below to start watching the interactive video lesson. The diagnostic quiz will unlock once you finish watching the lesson.
            </p>

            <button
              type="button"
              id="watch-video-lesson-button"
              onClick={playVideo}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Video Lesson</span>
            </button>
          </div>
        )}

        {/* Speaking Subtitle Pill Overlay */}
        {speakingText && (
          <div className="absolute bottom-2 left-3 right-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2.5 text-xs text-cyan-200 shadow-lg animate-fadeIn z-20 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-snug">{speakingText}</p>
          </div>
        )}
      </div>

      {/* Video Progress & Scrub Bar */}
      <div className="pt-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span className="font-sans font-bold text-cyan-400">{videoProgress}%</span>
          <span>{formatTime(videoDuration)}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              hasCompleted
                ? 'bg-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${videoProgress}%` }}
          />
        </div>
      </div>

      {/* Video Controls Footer */}
      <div className="flex items-center justify-between text-xs pt-3 mt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Radio className="w-3.5 h-3.5" />
          <span>{hasCompleted ? 'Lesson Completed' : isPlaying ? 'Playing Lesson...' : 'Paused / Ready'}</span>
        </div>

        {/* Playback Actions */}
        <div className="flex items-center gap-2">
          {hasCompleted ? (
            <button
              type="button"
              id="rewatch-video-button"
              onClick={handleRestartVideo}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Rewatch</span>
            </button>
          ) : isPlaying ? (
            <button
              type="button"
              id="pause-video-button"
              onClick={pauseVideo}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Pause className="w-3 h-3 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              id="play-video-button"
              onClick={playVideo}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{status === 'connected' ? 'Resume' : 'Play Lesson'}</span>
            </button>
          )}

          {status === 'connected' && (
            <button
              type="button"
              onClick={stopSession}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              title="Stop Stream"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default LiveAvatar;
