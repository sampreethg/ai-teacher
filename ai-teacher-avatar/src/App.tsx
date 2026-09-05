import { useEffect, useRef, useState } from "react";
import { AITeacherAvatar } from "./components/AITeacherAvatar";
import type { AvatarStatus } from "./types/avatar";
import { createAvatarApiClient } from "./services/avatarApi";
import { createLiveAvatarSessionController, sendTeachingText } from "./services/liveAvatarSession";
import "./styles.css";

const lessons = [
  { title: "The art of asking better questions", duration: "12 min", active: true },
  { title: "Listening for the hidden premise", duration: "18 min", active: false },
  { title: "A practical guide to curiosity", duration: "16 min", active: false },
];

export default function App() {
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lessonText, setLessonText] = useState("");
  const [lessonSendState, setLessonSendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [lessonError, setLessonError] = useState("");
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const sessionController = useRef<ReturnType<typeof createLiveAvatarSessionController> | null>(null);

  useEffect(() => {
    if (status === "idle" || status === "error") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    sessionController.current = createLiveAvatarSessionController(
      createAvatarApiClient({ baseUrl: "" }),
      setStatus,
      (error) => console.error(error),
    );
    return () => { void sessionController.current?.stop(); };
  }, []);

  const startLesson = async () => {
    const started = await sessionController.current?.start();
    if (!started) return;
    if (videoElement.current) sessionController.current?.attach(videoElement.current);
    sessionController.current?.speak("Welcome to today's lesson. Let's explore curiosity as a skill.");
  };
  const stopLesson = () => sessionController.current?.stop();
  const retryLesson = () => startLesson();
  const setMicrophoneMuted = async (value: boolean) => {
    if (value) await sessionController.current?.mute();
    else await sessionController.current?.unmute();
    setMuted(value);
  };

  const teachLesson = async () => {
    const text = lessonText.trim();
    if (!sessionController.current || (status !== "connected" && status !== "speaking")) {
      setLessonError("Start the lesson first");
      setLessonSendState("error");
      return;
    }
    if (!text) {
      setLessonError("Enter an explanation first");
      setLessonSendState("error");
      return;
    }

    setLessonError("");
    setLessonSendState("sending");
    try {
      sendTeachingText(text);
      setLessonSendState("sent");
    } catch (error) {
      setLessonError(error instanceof Error ? error.message : "Lesson could not be sent");
      setLessonSendState("error");
    }
  };

  const formattedElapsed = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-glyph">A</span><span>atelier</span></div>
        <div className="workspace-switcher"><span className="workspace-dot" /> Personal studio <span className="chevron">⌄</span></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#room"><span>▦</span> Teaching room</a>
          <a className="nav-item" href="#library"><span>▤</span> Lesson library</a>
          <a className="nav-item" href="#history"><span>◷</span> Session history</a>
        </nav>
        <div className="sidebar-footer"><span className="avatar-mini">JD</span><div><strong>Jordan Davis</strong><small>Educator account</small></div><span className="more">•••</span></div>
      </aside>

      <section className="workspace" id="room">
        <header className="topbar"><div><span className="eyebrow">TEACHING ROOM / SESSION 04</span><h1>Good questions open doors.</h1></div><div className="topbar-actions"><span className="save-state"><span className="saved-dot" /> All changes saved</span><button className="icon-button" aria-label="Open settings">⚙</button></div></header>

        <div className="content-grid">
          <section className="lesson-column">
            <div className="section-heading"><div><span className="eyebrow">CURRENT LESSON</span><h2>Curiosity as a skill</h2></div><span className="lesson-count">04 / 08</span></div>
            <AITeacherAvatar
              status={status}
              muted={muted}
              onStart={startLesson}
              onStop={stopLesson}
              onRetry={retryLesson}
              onVideoElement={(element) => { videoElement.current = element; }}
              onMuteChange={setMicrophoneMuted}
            />
            <div className="lesson-composer">
              <div className="composer-heading">
                <div><span className="eyebrow">AI TEACHER INPUT</span><h3>What should the avatar explain?</h3></div>
                <span className="composer-mode">LIVE LESSON</span>
              </div>
              <textarea
                value={lessonText}
                onChange={(event) => { setLessonText(event.target.value); setLessonSendState("idle"); setLessonError(""); }}
                placeholder="Write an explanation, example, or prompt for today's lesson..."
                rows={4}
                aria-label="AI Teacher explanation"
              />
              <div className="composer-footer">
                <span className={`lesson-send-status ${lessonSendState}`} role="status" aria-live="polite">
                  {lessonSendState === "sending" ? "Sending lesson..." : lessonSendState === "sent" ? "Lesson sent" : lessonError}
                </span>
                <button
                  className="teach-button"
                  type="button"
                  onClick={teachLesson}
                  disabled={lessonSendState === "sending" || status === "idle" || status === "connecting" || status === "reconnecting" || status === "error"}
                >
                  Teach This <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
            <div className="lesson-caption"><div className="caption-mark">“</div><div><p>“The quality of your attention determines the quality of the questions you can ask.”</p><span>— A note for today’s practice</span></div></div>
          </section>

          <aside className="lesson-rail">
            <div className="rail-header"><span className="eyebrow">LESSON PLAN</span><button className="text-button">Edit <span>↗</span></button></div>
            <div className="lesson-list">{lessons.map((lesson, index) => <div className={`lesson-row ${lesson.active ? "active" : ""}`} key={lesson.title}><span className="lesson-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{lesson.title}</strong><small>{lesson.duration}</small></div>{lesson.active ? <span className="now-playing">Now</span> : <span className="row-arrow">↗</span>}</div>)}</div>
            <div className="coach-note"><span className="eyebrow">COACH'S NOTE</span><p>Let the silence do some of the teaching. Give each question room to land.</p><span className="note-line" /></div>
            <div className="session-stat"><div><span className="eyebrow">SESSION TIME</span><strong>{formattedElapsed}</strong></div><div><span className="eyebrow">PACE</span><strong>Steady</strong></div></div>
          </aside>
        </div>
        <footer className="room-footer"><span>Atelier AI Teacher</span><span>Practice is a form of attention.</span><span>v0.1 / preview</span></footer>
      </section>
    </main>
  );
}
