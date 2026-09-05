import { useEffect, useRef, useState } from "react";
import { AvatarControls } from "./AvatarControls";
import { ConnectionStatus } from "./ConnectionStatus";
import type { AvatarProps, AvatarStatus } from "../types/avatar";

const defaultStatus: AvatarStatus = "idle";

export function AITeacherAvatar({
  autoStart = false,
  muted = false,
  status = defaultStatus,
  error,
  onStart,
  onPauseVideo,
  onResumeVideo,
  onVideoElement,
  onMuteChange,
  onRetry,
  onStop,
}: AvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);

  useEffect(() => {
    onVideoElement?.(videoRef.current);
    return () => onVideoElement?.(null);
  }, [onVideoElement]);

  useEffect(() => {
    if (autoStart) {
      onStart?.();
    }
  }, [autoStart, onStart]);

  const pauseVideo = () => {
    videoRef.current?.pause();
    setVideoPaused(true);
    onPauseVideo?.();
  };

  const resumeVideo = async () => {
    await videoRef.current?.play();
    setVideoPaused(false);
    onResumeVideo?.();
  };

  return (
    <section className="avatar-module" aria-label="AI teacher avatar">
      <div className="avatar-stage has-stream">
        <video ref={videoRef} autoPlay playsInline muted={muted} />
        {status === "idle" && (
          <div className="stream-placeholder" aria-label="Live avatar stream unavailable">
            <div className="placeholder-mark" aria-hidden="true">AT</div>
            <strong>Live avatar preview</strong>
            <span>Start a session to connect</span>
          </div>
        )}
        <div className="stage-meta">
          <ConnectionStatus status={status} error={error} />
          {status === "speaking" && (
            <span className="speaking-indicator">
              <span className="speaking-bars" aria-hidden="true"><i /><i /><i /><i /></span>
              Teacher is speaking...
            </span>
          )}
        </div>
      </div>
      <AvatarControls
        status={status}
        muted={muted}
        onStart={onStart}
        videoPaused={videoPaused}
        onPauseVideo={pauseVideo}
        onResumeVideo={resumeVideo}
        onMuteChange={onMuteChange}
        onRetry={onRetry}
        onStop={onStop}
      />
    </section>
  );
}
