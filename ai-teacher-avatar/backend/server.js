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

// Basic Auth Middleware (Optional API Key Check)
const checkAuth = (req, res, next) => {
  // If the frontend sets an Authorization header or we rely on session
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  if (process.env.NODE_ENV === 'production' && !authHeader) {
    // Basic protection for production
    // return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
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
