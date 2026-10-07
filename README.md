# 🎓 AI Teacher - Interactive AI-Powered Educational Platform

**AI Teacher** is a full-stack, AI-driven educational platform designed to transform learning into an interactive, personalized experience. Featuring a real-time **interactive AI Avatar teacher**, document-based **RAG (Retrieval-Augmented Generation)** context ingestion, custom lesson plan generation, and intelligent quiz evaluation powered by **Google Gemini**.

---

Live link: https://ai-teacher-hackathon.vercel.app/

## ✨ Features

- 🤖 **Interactive AI Avatar Teacher**: Engaging real-time visual teacher powered by HeyGen / LiveAvatar SDK.
- 📄 **RAG Document Ingestion**: Upload course materials (PDFs, notes) to build a custom knowledge context for your classroom.
- 📖 **Automated Lesson & Quiz Generation**: Generate structured curriculum, interactive quizzes, and instant assessment using Google Gemini.
- 📊 **Real-time Evaluation**: Automated grading and constructive feedback for student responses.
- 🔐 **User Management & Authentication**: Secure sign-up/login with NextAuth.js and data persistence via Prisma ORM & PostgreSQL.
- 💻 **Modern Dynamic UI**: Built with Next.js 14 App Router, Tailwind CSS, and responsive layouts.

---

## 🛠️ Tech Stack

### Frontend & App Framework
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma (PostgreSQL / Vercel Postgres)

### AI & Backend Services
- **AI Core Engine**: Python, FastAPI, Uvicorn
- **AI Model**: Google Gemini API (`google-genai`)
- **Avatar Backend**: Node.js, Express, HeyGen / LiveAvatar Web SDK (`@heygen/liveavatar-web-sdk`)

---

## 📁 Project Structure

```text
├── app/                      # Next.js App Router (pages, API routes, components)
│   ├── classroom/            # Interactive avatar classroom view
│   ├── studio/               # Lesson creation & document upload studio
│   ├── dashboard/            # User dashboard & lesson library
│   └── api/                  # Next.js API routes (auth, chat, upload, avatar proxy)
├── components/               # UI components
├── AI_Teacher/               # Python FastAPI backend
│   └── AI_Teacher/
│       ├── ai_engine/        # RAG retriever, lesson & quiz generators, evaluator
│       └── api/main.py       # FastAPI endpoints
├── ai-teacher-avatar/        # LiveAvatar backend service (Node.js/Express)
│   └── backend/server.js     # LiveAvatar session tokens & WebSockets endpoint
├── prisma/                   # Prisma database schema & SQLite/Postgres configs
├── package.json              # Project configuration and script commands
└── .env                      # Environment variables configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **Python**: `v3.10` or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL Database** (or configured Vercel Postgres / local database)

---

### Environment Variables Setup

Create a `.env` file in the root directory and configure the following variables:

```env
# Database Credentials
DATABASE_URL="postgresql://user:password@localhost:5432/aiteacher"
DIRECT_URL="postgresql://user:password@localhost:5432/aiteacher"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# LiveAvatar / HeyGen Configuration
LIVEAVATAR_API_KEY="your-liveavatar-api-key"
LIVEAVATAR_AVATAR_ID="your-avatar-id"
LIVEAVATAR_VOICE_ID="your-voice-id"
AVATAR_BACKEND_URL="http://localhost:3001"
```

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sampreethg/ai-teacher-hackathon.git
   cd 2
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for `AI_Teacher`):
   ```bash
   cd AI_Teacher/AI_Teacher
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate

   pip install fastapi uvicorn google-genai python-dotenv pydantic
   cd ../..
   ```

4. **Initialize Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

## 🏃 Running the Application

### Option 1: Run All Services Concurrently (Recommended)

Start the Next.js frontend, Avatar server, and Python AI FastAPI server simultaneously:

```bash
npm run dev
```

This will launch:
- 🌐 **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
- 👤 **Avatar Backend Server**: [http://localhost:3001](http://localhost:3001)
- 🐍 **FastAPI AI Engine**: [http://localhost:8000](http://localhost:8000)

---

### Option 2: Run Services Individually

If you prefer launching each service in separate terminal windows:

- **Next.js Frontend**:
  ```bash
  npm run dev:next
  ```

- **Avatar Backend**:
  ```bash
  npm run dev:avatar
  ```

- **Python AI Engine**:
  ```bash
  npm run dev:ai
  ```

---

## 📜 Available Scripts

- `npm run dev`: Runs all 3 microservices concurrently.
- `npm run dev:next`: Runs the Next.js frontend server.
- `npm run dev:avatar`: Runs the HeyGen LiveAvatar express backend.
- `npm run dev:ai`: Runs the FastAPI Python AI backend.
- `npm run build`: Generates Prisma client, syncs schema, and builds Next.js production bundle.
- `npm run start`: Starts Next.js in production mode.
- `npm run lint`: Runs ESLint check across the codebase.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the issues page or submit a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
