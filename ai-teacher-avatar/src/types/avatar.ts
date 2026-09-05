export type AvatarStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "reconnecting"
  | "error";

export interface AvatarSessionRequest {
  avatarId?: string;
}

export interface AvatarSession {
  session_id: string;
  session_token: string;
}

export interface AvatarProps {
  teachingText?: string;
  autoStart?: boolean;
  muted?: boolean;
  status?: AvatarStatus;
  error?: Error | null;
  onStart?: () => void;
  onPauseVideo?: () => void;
  onResumeVideo?: () => void;
  onVideoElement?: (element: HTMLVideoElement | null) => void;
  onMuteChange?: (muted: boolean) => void;
  onRetry?: () => void;
  onStop?: () => void;
  onStatusChange?: (status: AvatarStatus) => void;
  onError?: (error: Error) => void;
}
