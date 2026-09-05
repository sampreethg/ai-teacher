import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionState,
} from "@heygen/liveavatar-web-sdk";
import type { AvatarApiClient } from "./avatarApi";
import type { AvatarStatus } from "../types/avatar";

let activeSession: LiveAvatarSession | null = null;

export function sendTeachingText(text: string): void {
  if (!activeSession) {
    throw new Error("LiveAvatar session is not active");
  }

  if (!text.trim()) {
    throw new Error("Teaching text cannot be empty");
  }

  activeSession.message(text);
}

export interface LiveAvatarSessionController {
  start(): Promise<boolean>;
  stop(): Promise<void>;
  mute(): Promise<void>;
  unmute(): Promise<void>;
  speak(text: string): void;
  attach(videoElement: HTMLVideoElement): void;
}

export function createLiveAvatarSessionController(
  apiClient: AvatarApiClient,
  onStatusChange: (status: AvatarStatus) => void,
  onError: (error: Error) => void,
): LiveAvatarSessionController {
  const requireSession = () => {
    if (!activeSession) throw new Error("LiveAvatar session has not been initialized");
    return activeSession;
  };

  return {
    async start() {
      try {
        onStatusChange("connecting");
        const sessionData = await apiClient.createSession({});
        activeSession = new LiveAvatarSession(sessionData.session_token, { voiceChat: true });
        activeSession.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
          if (state === SessionState.CONNECTED) onStatusChange("connected");
          if (state === SessionState.DISCONNECTED) onStatusChange("idle");
        });
        activeSession.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => onStatusChange("speaking"));
        activeSession.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => onStatusChange("connected"));
        activeSession.on(SessionEvent.SESSION_DISCONNECTED, () => onStatusChange("idle"));
        await activeSession.start();
        return true;
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error("LiveAvatar session failed");
        onStatusChange("error");
        onError(normalizedError);
        activeSession = null;
        return false;
      }
    },
    async stop() {
      if (!activeSession) return;
      await activeSession.stop();
      activeSession = null;
      onStatusChange("idle");
    },
    mute: () => requireSession().voiceChat.mute(),
    unmute: () => requireSession().voiceChat.unmute(),
    speak: sendTeachingText,
    attach(videoElement) {
      requireSession().attach(videoElement);
    },
  };
}