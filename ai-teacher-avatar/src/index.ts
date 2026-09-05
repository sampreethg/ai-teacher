export { AITeacherAvatar } from "./components/AITeacherAvatar";
export { AvatarControls } from "./components/AvatarControls";
export { ConnectionStatus } from "./components/ConnectionStatus";
export { createAvatarApiClient } from "./services/avatarApi";
export { sendTeachingText } from "./services/liveAvatarSession";
export type { AvatarApiClient, AvatarApiClientOptions } from "./services/avatarApi";
export type {
  AvatarProps,
  AvatarSession,
  AvatarSessionRequest,
  AvatarStatus,
} from "./types/avatar";
