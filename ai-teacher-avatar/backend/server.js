import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config(); // fallback to root cwd .env if present

import cors from "cors";
import express from "express";
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
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for local hackathon development
    }
  },
  credentials: true
}));

app.use(express.json({ limit: "32kb" }));

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
