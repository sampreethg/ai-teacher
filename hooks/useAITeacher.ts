import { useState, useRef, useCallback } from 'react';
import { getVoiceByLanguage } from '@/lib/config/voices';

export interface UseAITeacherOptions {
  avatarBackendUrl?: string;
  defaultLanguage?: string;
  defaultVoiceId?: string;
}

export function useAITeacher(options: UseAITeacherOptions = {}) {
  const {
    avatarBackendUrl = 'http://localhost:3001',
    defaultLanguage = 'en-GB',
    defaultVoiceId
  } = options;

  const [language, setLanguage] = useState<string>(defaultLanguage);
  const [voiceId, setVoiceId] = useState<string>(
    defaultVoiceId || getVoiceByLanguage(defaultLanguage).id
  );
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'error'>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);

  const updateLanguage = useCallback((newLangKey: string) => {
    const config = getVoiceByLanguage(newLangKey);
    setLanguage(newLangKey);
    setVoiceId(config.id);
  }, []);

  const startLesson = useCallback(async (customVoiceId?: string, customLang?: string) => {
    setStatus('connecting');
    setErrorMessage(null);

    const activeVoice = customVoiceId || voiceId;
    const activeLang = customLang || language;

    try {
      let response = await fetch(`${avatarBackendUrl}/api/avatar/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          voice_id: activeVoice,
          language: activeLang,
        }),
      }).catch(() => null);

      if (!response || !response.ok) {
        const fallbackRes = await fetch('/api/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            voice_id: activeVoice,
            language: activeLang,
          }),
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          response = fallbackRes;
        }
      }

      if (!response || !response.ok) {
        const err = response ? await response.json().catch(() => ({})) : {};
        throw new Error(err.message || `Session initialization failed: ${response?.status || 'network error'}`);
      }

      const sessionData = await response.json();
      const token = sessionData.session_token;

      if (!token) {
        throw new Error('No session token returned.');
      }

      const { LiveAvatarSession, SessionEvent, SessionState, AgentEventsEnum } =
        await import('@heygen/liveavatar-web-sdk');

      const session = new LiveAvatarSession(token, { voiceChat: true });
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, (state: any) => {
        if (state === SessionState.CONNECTED) setStatus('connected');
        if (state === SessionState.DISCONNECTED) setStatus('idle');
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setStatus('speaking');
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setStatus('connected');
        setSpeakingText(null);
      });

      await session.start();
      setStatus('connected');
      return session;
    } catch (err: any) {
      console.error('[useAITeacher] Error starting avatar lesson:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Avatar connection failed');
      return null;
    }
  }, [avatarBackendUrl, voiceId, language]);

  const speak = useCallback((text: string) => {
    if (!text?.trim()) return;
    setSpeakingText(text);

    if (sessionRef.current && (status === 'connected' || status === 'speaking')) {
      try {
        sessionRef.current.message(text);
      } catch (err) {
        console.error('[useAITeacher] Speak error:', err);
      }
    } else {
      setStatus('speaking');
      setTimeout(() => {
        setStatus(sessionRef.current ? 'connected' : 'idle');
        setSpeakingText(null);
      }, Math.min(Math.max(text.length * 60, 3000), 10000));
    }
  }, [status]);

  const interrupt = useCallback(async () => {
    setSpeakingText(null);
    if (sessionRef.current) {
      try {
        if (typeof sessionRef.current.interrupt === 'function') {
          await sessionRef.current.interrupt();
        } else if (typeof sessionRef.current.stopTalking === 'function') {
          await sessionRef.current.stopTalking();
        } else if (sessionRef.current.voiceChat?.interrupt) {
          await sessionRef.current.voiceChat.interrupt();
        }
      } catch (err) {
        console.warn('[useAITeacher] Interrupt error:', err);
      }
    }
    setStatus(sessionRef.current ? 'connected' : 'idle');
  }, []);

  const stopLesson = useCallback(async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
    } catch (e) {
      console.error('[useAITeacher] Stop error:', e);
    } finally {
      setStatus('idle');
      setSpeakingText(null);
    }
  }, []);

  return {
    language,
    voiceId,
    status,
    isMuted,
    speakingText,
    errorMessage,
    updateLanguage,
    startLesson,
    speak,
    interrupt,
    stopLesson,
    setIsMuted,
    sessionRef,
  };
}
