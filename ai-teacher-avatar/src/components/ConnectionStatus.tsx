import type { AvatarStatus } from "../types/avatar";

export interface ConnectionStatusProps {
  status: AvatarStatus;
  error?: Error | null;
}

const statusLabels: Record<AvatarStatus, string> = {
  idle: "Disconnected",
  connecting: "Connecting...",
  connected: "🎓 Teacher is ready",
  speaking: "🎓 Teacher is speaking...",
  reconnecting: "Connecting...",
  error: "Connection error",
};

export function ConnectionStatus({ status, error }: ConnectionStatusProps) {
  return (
    <p className="connection-status" role="status" aria-live="polite" data-status={status}>
      <span className="status-dot" aria-hidden="true" />
      <span>{statusLabels[status]}</span>
      {status === "error" && error ? `: ${error.message}` : null}
    </p>
  );
}
