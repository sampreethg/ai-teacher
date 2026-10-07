import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config(); // fallback to root cwd .env if present

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createAvatarRouter } from "./routes/avatar.js";

const apiKey = process.env.LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
const avatarId = process.env.LIVEAVATAR_AVATAR_ID;

console.info("LiveAvatar environment diagnostic", {
  apiKeyExists: Boolean(apiKey),
  apiKeyLength: apiKey?.length ?? 0,
  avatarIdExists: Boolean(avatarId),
  avatarIdLength: avatarId?.length ?? 0,
});

const app = express();
const port = Number(process.env.PORT ?? 3001);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' }
});

app.use(limiter);
app.use(express.json({ limit: "2mb" })); // Reduced limit for safety

const authSecret = process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  console.error(
    "CRITICAL CONFIGURATION ERROR: NEXTAUTH_SECRET is required but missing from environment variables."
  );
  throw new Error(
    "NEXTAUTH_SECRET environment variable is missing. The avatar backend requires NEXTAUTH_SECRET to validate authenticated sessions."
  );
}

// Internal service key (optional additional service-to-service handshake)
const internalSecret = process.env.AVATAR_INTERNAL_SECRET || process.env.INTERNAL_API_KEY;

const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

    // Check service-to-service key if configured
    if (internalSecret && authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
      if (token === internalSecret) {
        return next();
      }
    }

    // Check NextAuth JWT bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      const { decode } = await import('next-auth/jwt');
      try {
        const decoded = await decode({ token: rawToken, secret: authSecret });
        if (decoded && (!decoded.exp || decoded.exp > Math.floor(Date.now() / 1000))) {
          req.user = decoded;
          return next();
        }
      } catch (err) {
        // Token decode failed
      }
    }

    // Check cookies (standard NextAuth session cookie: next-auth.session-token or __Secure-next-auth.session-token)
    if (req.headers.cookie) {
      const { default: cookie } = await import('cookie');
      const cookies = cookie.parse(req.headers.cookie);
      const sessionToken =
        cookies['next-auth.session-token'] ||
        cookies['__Secure-next-auth.session-token'];

      if (sessionToken) {
        const { decode } = await import('next-auth/jwt');
        try {
          const decoded = await decode({ token: sessionToken, secret: authSecret });
          if (decoded && (!decoded.exp || decoded.exp > Math.floor(Date.now() / 1000))) {
            req.user = decoded;
            return next();
          }
        } catch (err) {
          // Cookie token decode failed
        }
      }
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authenticated session is required before creating an avatar session.'
    });
  } catch (error) {
    console.error('[checkAuth] Error verifying authentication session:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session validation failed.'
    });
  }
};

app.use('/api/avatar', checkAuth);

app.use(
  "/api/avatar",
  createAvatarRouter({
    providerUrl: process.env.LIVEAVATAR_API_URL ?? "https://api.liveavatar.com",
    avatarId: avatarId,
    voiceId: process.env.LIVEAVATAR_VOICE_ID,
    contextId: process.env.LIVEAVATAR_CONTEXT_ID,
    language: process.env.LIVEAVATAR_LANGUAGE ?? "en",
    isSandbox: process.env.LIVEAVATAR_IS_SANDBOX === "true",
    apiKey: apiKey,
  }),
);

app.get("/health", (_request, response) => response.json({ status: "ok" }));

app.listen(port, () => {
  console.log(`Avatar backend listening on http://127.0.0.1:${port}`);
});
