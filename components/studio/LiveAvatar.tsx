'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef
} from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  AlertCircle,
  GraduationCap,
  RefreshCw,
  Radio
} from 'lucide-react';

export type AvatarStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'error';

export interface LiveAvatarRef {
  speak: (text: string) => void;
  interrupt: () => Promise<void>;
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
  mute: (value: boolean) => Promise<void>;
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
    statusOverlay = null
  },
  ref
) {
  const [status, setStatus] = useState<AvatarStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<any>(null);

  const updateStatus = (newStatus: AvatarStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  const startSession = async (): Promise<boolean> => {
    try {
      setErrorMessage(null);
      updateStatus('connecting');

      // 1. Fetch token from Express Avatar Backend (Port 3001)
      const tokenEndpoint = `${avatarBackendUrl}/api/avatar/session`;
      const tokenRes = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_id: voiceId,
          language: language,
        })
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.error ||
          `Backend returned status ${tokenRes.status}. Make sure HEYGEN_API_KEY is configured in ai-teacher-avatar/backend/.env`
        );
      }

      const sessionData = await tokenRes.json();
      const sessionToken = sessionData.session_token;

      if (!sessionToken) {
        throw new Error('No session token returned from avatar backend.');
      }

      // 2. Dynamically import HeyGen SDK for browser WebRTC environment
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
      });

      session.on(SessionEvent.SESSION_DISCONNECTED, () => {
        updateStatus('idle');
      });

      await session.start();

      if (videoRef.current) {
        session.attach(videoRef.current);
      }

      updateStatus('connected');
      return true;
    } catch (err: any) {
      console.warn('[LiveAvatar] WebRTC session start failed or credentials pending:', err);
      // Fallback to unified Simulation Mode
      setIsSimulating(true);
      updateStatus('connected');
      setErrorMessage(err.message || 'Could not connect to Live Avatar stream. Falling back to Simulation Mode.');
      return false;
    }
  };

  const stopSession = async () => {
    try {
      setIsSimulating(false);
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
      // Unified simulation management
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
    setIsMuted(nextMuted);
  };

  const interrupt = async () => {
    setSpeakingText(null);
    if (sessionRef.current) {
      try {
        if (typeof sessionRef.current.interrupt === 'function') {
          await sessionRef.current.interrupt();
        } else if (typeof sessionRef.current.stopTalking === 'function') {
          await sessionRef.current.stopTalking();
        } else if (sessionRef.current.voiceChat && typeof sessionRef.current.voiceChat.interrupt === 'function') {
          await sessionRef.current.voiceChat.interrupt();
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
    mute: async (val: boolean) => {
      if (sessionRef.current?.voiceChat) {
        if (val) await sessionRef.current.voiceChat.mute();
        else await sessionRef.current.voiceChat.unmute();
      }
      setIsMuted(val);
    }
  }));

  useEffect(() => {
    if (autoStart) {
      startSession();
    }
    return () => {
      void stopSession();
    };
  }, [autoStart]);

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-slate-100 shadow-xl ${className}`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isSimulating
                ? 'bg-purple-400 animate-pulse'
                : status === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : status === 'speaking'
                ? 'bg-cyan-400 animate-ping'
                : status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : status === 'error'
                ? 'bg-rose-400'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-semibold tracking-wide">
            {educatorName} &bull; {educatorTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video & Stream Canvas Area */}
      <div className="relative my-auto py-4 flex flex-col items-center justify-center min-h-[260px]">
        {/* Status Feedback Overlay (e.g., "Listening...", "Analyzing doubt...") */}
        {statusOverlay && (
          <div className="absolute top-2 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl p-2.5 text-xs text-amber-200 shadow-2xl animate-fadeIn z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-white tracking-wide">{statusOverlay}</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        )}

        {/* WebRTC Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full max-h-[280px] rounded-xl object-cover bg-black/40 transition-opacity duration-300 ${
            status === 'connected' || status === 'speaking' ? 'opacity-100 block' : 'hidden'
          }`}
        />

        {/* Fallback / Animated Placeholder when stream is idle or connecting */}
        {status !== 'connected' && status !== 'speaking' && (
          <div className="my-auto text-center z-10 py-4 flex flex-col items-center">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-1 shadow-2xl mb-4 relative">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                <GraduationCap className="w-16 h-16 text-cyan-400 animate-float" />
                
                {/* Visual Audio Frequency Waves */}
                <div className="absolute bottom-2 flex items-center gap-1">
                  <div className="w-1 h-3 bg-cyan-400 animate-pulse" />
                  <div className="w-1 h-6 bg-cyan-300 animate-pulse delay-75" />
                  <div className="w-1 h-2 bg-cyan-500 animate-pulse delay-150" />
                  <div className="w-1 h-5 bg-blue-500 animate-pulse delay-100" />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-sm leading-relaxed px-4">
              {speakingText ? (
                <span>&ldquo;{speakingText}&rdquo;</span>
              ) : (
                <span>&ldquo;Welcome to your interactive session! Connect the Live Avatar to begin real-time WebRTC visual lecture & derivations.&rdquo;</span>
              )}
            </p>
          </div>
        )}

        {/* Speaking Subtitle Pill Overlay */}
        {status === 'speaking' && speakingText && (
          <div className="absolute bottom-2 left-3 right-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2.5 text-xs text-cyan-200 shadow-lg animate-fadeIn z-20 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-snug">{speakingText}</p>
          </div>
        )}
      </div>

      {/* Error notice if credentials missing */}
      {isSimulating && errorMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Simulation Mode: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
      {status === 'error' && !isSimulating && errorMessage && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">LiveAvatar Notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Bottom Footer with Status & Controls */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Radio className="w-3.5 h-3.5" />
          <span className="capitalize">{status === 'speaking' ? 'Speaking...' : status}</span>
          {status === 'connected' && <span className="text-[10px] text-slate-400 font-normal">&bull; {isSimulating ? 'Simulation Mode' : 'WebRTC 38ms'}</span>}
        </div>

        {/* Start / Stop Stream Action */}
        <div className="flex items-center gap-2">
          {status === 'connected' || status === 'speaking' ? (
            <button
              type="button"
              onClick={stopSession}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Stream</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startSession}
              disabled={status === 'connecting'}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {status === 'connecting' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Live Avatar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default LiveAvatar;
