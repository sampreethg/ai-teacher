import type { AvatarSession, AvatarSessionRequest } from "../types/avatar";

export interface AvatarApiClient {
  createSession(request: AvatarSessionRequest): Promise<AvatarSession>;
}

export interface AvatarApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export function createAvatarApiClient({
  baseUrl,
  fetcher = fetch,
}: AvatarApiClientOptions): AvatarApiClient {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    if (!response.ok) {
      let message = `Avatar API request failed (${response.status})`;
      try {
        const errorPayload = (await response.json()) as {
          message?: string;
          providerStatus?: number;
        };
        if (errorPayload.message) {
          message = errorPayload.providerStatus
            ? `${errorPayload.message} (${errorPayload.providerStatus})`
            : errorPayload.message;
        }
      } catch {
        // Preserve the HTTP status when the backend does not return JSON.
      }
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  };

  return {
    createSession: (body) =>
      request<AvatarSession>("/api/avatar/session", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  };
}
