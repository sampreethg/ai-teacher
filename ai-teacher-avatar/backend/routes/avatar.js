import { Router } from "express";

export function createAvatarRouter({ providerUrl, avatarId, voiceId, contextId, language, isSandbox, apiKey, fetcher = fetch }) {
  const router = Router();

  const handleCreateSession = async (request, response) => {
    try {
      if (!apiKey || !avatarId) {
        return response.status(500).json({
          error: "Missing avatar credentials",
          message: "LIVEAVATAR_API_KEY / HEYGEN_API_KEY and LIVEAVATAR_AVATAR_ID must be set in backend .env."
        });
      }

      const reqBody = request.body || {};
      const activeVoiceId = reqBody.voice_id || reqBody.voiceId || voiceId;
      const activeLanguage = reqBody.language || language;
      const activeAvatarId = reqBody.avatar_id || reqBody.avatarId || avatarId;

      const providerResponse = await fetcher(`${providerUrl}/v1/sessions/token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          mode: "FULL",
          avatar_id: activeAvatarId,
          is_sandbox: isSandbox,
          ...(activeVoiceId || contextId || activeLanguage
            ? {
                avatar_persona: {
                  ...(activeVoiceId ? { voice_id: activeVoiceId } : {}),
                  ...(contextId ? { context_id: contextId } : {}),
                  ...(activeLanguage ? { language: activeLanguage } : {}),
                },
              }
            : {}),
        }),
      });

      if (!providerResponse.ok) {
        const providerBody = await providerResponse.text();
        console.error("LiveAvatar session token request failed", {
          status: providerResponse.status,
          statusText: providerResponse.statusText,
          body: providerBody,
        });
        return response.status(502).json({
          error: "LiveAvatar session token could not be created",
          providerStatus: providerResponse.status,
          message: providerResponse.statusText || "LiveAvatar rejected the request",
        });
      }

      const providerPayload = await providerResponse.json();
      const session = providerPayload.data;

      if (!session?.session_id || !session?.session_token) {
        throw new Error("LiveAvatar returned an invalid session token response");
      }

      return response.status(200).json({
        session_id: session.session_id,
        session_token: session.session_token,
      });
    } catch (error) {
      console.error("Avatar session initialization failed", error);
      return response.status(502).json({ error: "LiveAvatar is unavailable" });
    }
  };

  router.post("/session", handleCreateSession);
  router.post("/token", handleCreateSession);

  return router;
}
