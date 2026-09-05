```markdown
# AI Teacher — Avatar & WebRTC Module

Reusable React avatar integration for real-time AI teaching. This module owns avatar video, WebRTC streaming, text-to-speech, voice synchronization, playback controls, and connection recovery.

## Scope

### Included

- AI Avatar API integration
- Real-time avatar video over WebRTC
- Text-to-Speech and voice synchronization
- Start and stop controls plus microphone mute/unmute
- Connection status, errors, and reconnection handling
- Reusable React Avatar component

### Not included

Authentication, student dashboards, RAG, PDF processing, lesson planning, assessment, databases, and learning recommendations are outside this module.

## Expected flow

```text
Teaching Agent → Teaching Text → Avatar API → WebRTC → React Video Component → Student
```

## Component contract

The component is independent of the main application and accepts teaching text through props. A provider-specific adapter should translate that text into the selected avatar API request and return the WebRTC session details.

```tsx
export type AvatarStatus =
	| "idle"
	| "connecting"
	| "connected"
	| "speaking"
	| "reconnecting"
	| "error";

export interface AvatarProps {
	teachingText?: string;
	autoStart?: boolean;
	muted?: boolean;
	onStatusChange?: (status: AvatarStatus) => void;
	onError?: (error: Error) => void;
}

export function AITeacherAvatar(props: AvatarProps): JSX.Element;
```

The UI must provide:

- Video display
- Connection and speaking status
- Start and stop session buttons
- Microphone mute/unmute control
- Error state with a retry action
- Reconnecting state

## Integration guidance

1. The backend creates a FULL-mode LiveAvatar session token.
2. The frontend initializes `LiveAvatarSession` with that session token.
3. The SDK starts the LiveKit-managed session and attaches remote media to the video element.
4. SDK lifecycle and avatar speaking events update connection and speaking status.
5. The session is stopped through the SDK when the user ends it.

Keep API credentials on the server or behind a secure token service; never expose provider secrets in the browser.

## Backend

The Express backend owns provider authentication. The browser calls `POST /api/avatar/session`; the backend creates a FULL-mode LiveAvatar session token and returns only the documented `session_id` and `session_token`.

```text
React
	↓ POST /api/avatar/session
Express backend
	↓ X-API-KEY: <server-side key>
LiveAvatar
	↓ session_id + session_token
React
```

Backend files are kept independent from the React package:

```text
backend/
├── server.js
├── routes/
│   └── avatar.js
├── .env
├── .env.example
└── package.json
```

Copy the values in `backend/.env.example` into the ignored `backend/.env`, then set the LiveAvatar URL, avatar ID, and API key. Start it with `cd backend` and `npm run dev`. The backend intentionally fails fast when `LIVEAVATAR_API_KEY` or `LIVEAVATAR_AVATAR_ID` is missing.

## Structure

```text
src/
├── components/
│   ├── AITeacherAvatar.tsx
│   ├── AvatarControls.tsx
│   └── ConnectionStatus.tsx
├── services/
│   ├── avatarApi.ts
│   └── liveAvatarSession.ts
├── types/
│   └── avatar.ts
└── index.ts
```

`AITeacherAvatar` remains the video presentation boundary. The dedicated `liveAvatarSession.ts` service owns the official SDK session and calls `attach(videoElement)`; it does not create a peer connection or simulate WebRTC.
```
