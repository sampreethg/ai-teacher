import type { AvatarStatus } from "../types/avatar";

export interface AvatarControlsProps {
  status: AvatarStatus;
  muted: boolean;
  videoPaused: boolean;
  onStart?: () => void;
  onPauseVideo?: () => void;
  onResumeVideo?: () => void;
  onMuteChange?: (muted: boolean) => void;
  onRetry?: () => void;
  onStop?: () => void;
}

export function AvatarControls({
  status,
  muted,
  videoPaused,
  onStart,
  onPauseVideo,
  onResumeVideo,
  onMuteChange,
  onRetry,
  onStop,
}: AvatarControlsProps) {
  const isActive = status === "connected" || status === "speaking";
  const isBusy = status === "connecting" || status === "reconnecting";

  return (
    <div className="avatar-controls" role="group" aria-label="Avatar controls">
      {status === "idle" && (
        <button className="control-button primary" type="button" onClick={onStart} disabled={!onStart}>
          <span aria-hidden="true">▶</span> Start lesson
        </button>
      )}
      {isActive && (
        <button className="control-button primary" type="button" onClick={onStop} disabled={!onStop}>
          <span aria-hidden="true">■</span> Stop session
        </button>
      )}
      {isActive && !videoPaused && (
        <button className="control-button secondary" type="button" onClick={onPauseVideo} disabled={!onPauseVideo}>
          <span aria-hidden="true">Ⅱ</span> Pause video
        </button>
      )}
      {isActive && videoPaused && (
        <button className="control-button secondary" type="button" onClick={onResumeVideo} disabled={!onResumeVideo}>
          <span aria-hidden="true">▶</span> Resume video
        </button>
      )}
      {status === "error" && (
        <button className="control-button primary" type="button" onClick={onRetry} disabled={!onRetry}>
          Retry connection
        </button>
      )}
      <button
        className="control-button secondary"
        type="button"
        onClick={() => onMuteChange?.(!muted)}
        disabled={isBusy || !onMuteChange}
        aria-pressed={muted}
      >
        <span aria-hidden="true">{muted ? "◉" : "◌"}</span> {muted ? "Unmute microphone" : "Mute microphone"}
      </button>
    </div>
  );
}
