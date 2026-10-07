import os
import sys
from pathlib import Path
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

load_dotenv(parent_dir / ".env")
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_engine.lesson_generator import generate_lesson
from ai_engine.question_generator import generate_questions
from ai_engine.answer_evaluator import evaluate_answer
from ai_engine.adaptive_engine import decide_next_action


app = FastAPI(
    title="AI Teacher API",
    description="Backend API for AI Teaching and Adaptive Intelligence",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# REQUEST MODELS
# =========================

class LessonRequest(BaseModel):
    topic: str
    level: str
    language: str
    duration: int
    style: str
    context: str = ""


class QuestionRequest(BaseModel):
    topic: str
    lesson: str
    level: str
    difficulty: str
    number_of_questions: int = 3


class EvaluationRequest(BaseModel):
    question: str
    correct_answer: str
    student_answer: str
    lesson: str


class AdaptRequest(BaseModel):
    score: int
    result: str
    misconception: str = ""


class ChatRequest(BaseModel):
    message: str
    topic: str = ""
    history: list = []


class DoubtRequest(BaseModel):
    question: str = ""
    message: str = ""
    topic: str = ""
    lesson: str = ""
    language: str = "English"


# =========================
# HOME
# =========================

@app.get("/")
def home():

    return {
        "message": "AI Teacher API is running"
    }


# =========================
# CHAT ENDPOINT (STUDIO)
# =========================

@app.post("/api/chat")
@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are an expert AI Teacher and Research Assistant.
Topic: {request.topic or "General Science & Technology"}
Student Question: {request.message}

Provide a clear, pedagogical, structured explanation with Markdown formatting, bullet points, and key derivations grounded in educational materials.
"""
            for model_name in ["gemini-3.8-flash", "gemini-3.5-flash-lite"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return {"response": response.text}
                except Exception as model_err:
                    print(f"[chat_endpoint] Model {model_name} failed: {model_err}")
            return {"response": "Service temporarily busy. Please try again."}
        else:
            return {"response": "API key not configured."}
    except Exception as e:
        return {"response": "Error generating response. Please try again."}


# =========================
# RAISE HAND DOUBT ENDPOINT
# =========================

@app.post("/api/ask_doubt")
@app.post("/ask_doubt")
def ask_doubt_endpoint(request: DoubtRequest):
    query = request.question or request.message or "Could you clarify this concept?"
    topic = request.topic or "Physics and Newton's Laws"
    lesson_context = request.lesson or "Newton's Second Law of Motion: F_net = m * a."
    language = request.language or "English"

    try:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            client = genai.Client(api_key=api_key)
            prompt = f"""You are an attentive multilingual AI Teacher conducting an interactive live classroom.
A student just raised their hand and interrupted the lecture to ask a doubt!

Current Topic: {topic}
Lesson Context: {lesson_context}
Target Language: {language}
Student's Spoken Doubt: "{query}"

CRITICAL LANGUAGE REQUIREMENT:
Respond in the exact Target Language ({language}).
- If Tamil, respond in Tamil script (தமிழ்).
- If Telugu, respond in Telugu script (తెలుగు).
- If Hindi, respond in Hindi Devanagari script (हिन्दी).
- If Kannada, respond in Kannada script (ಕನ್ನಡ).
- If Spanish, French, or German, respond in that language.
- If Hinglish, use natural conversational Hinglish.
- If English, use standard English.

Respond directly to the student in a supportive, crystal-clear, conversational manner (around 2-3 concise sentences) suitable for text-to-speech avatar delivery.
Clarify the doubt directly and transition encouragingly back to the lesson.
"""
            for model_name in ["gemini-3.8-flash", "gemini-3.5-flash-lite"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    explanation = response.text.strip()
                    return {
                        "status": "success",
                        "question": query,
                        "explanation": explanation,
                        "response": explanation
                    }
                except Exception as model_err:
                    print(f"[ask_doubt] Model {model_name} failed: {model_err}")
    except Exception as err:
        print(f"[ask_doubt] AI generation error: {err}")

    # Fallback explanation
    fallback = "I'm having trouble connecting right now, but that is a great question!"
    return {
        "status": "error",
        "question": query,
        "explanation": fallback,
        "response": fallback
    }



# =========================
# LESSON GENERATOR
# =========================

@app.post("/api/lesson")
@app.post("/generate_lesson")
@app.post("/api/generate_lesson")
def create_lesson(request: LessonRequest):

    lesson = generate_lesson(
        topic=request.topic,
        level=request.level,
        language=request.language,
        duration=request.duration,
        style=request.style,
        context=request.context
    )

    return {
        "topic": request.topic,
        "lesson": lesson
    }


# =========================
# QUESTION GENERATOR
# =========================

@app.post("/api/question")
def create_questions(request: QuestionRequest):

    questions = generate_questions(
        topic=request.topic,
        lesson=request.lesson,
        level=request.level,
        difficulty=request.difficulty,
        number_of_questions=request.number_of_questions
    )

    return questions


# =========================
# ANSWER EVALUATOR
# =========================

@app.post("/api/evaluate")
@app.post("/evaluate_answer")
@app.post("/api/evaluate_answer")
def evaluate_student(request: EvaluationRequest):

    evaluation = evaluate_answer(
        question=request.question,
        correct_answer=request.correct_answer,
        student_answer=request.student_answer,
        lesson=request.lesson
    )

    return evaluation


# =========================
# ADAPTIVE ENGINE
# =========================

@app.post("/api/adapt")
def adapt_student(request: AdaptRequest):

    result = decide_next_action(
        score=request.score,
        result=request.result,
        misconception=request.misconception
    )

    return result

# =========================
# COMPLETE ADAPTIVE TEACHING
# =========================

class TeachingRequest(BaseModel):
    topic: str
    lesson: str
    level: str
    question: str
    correct_answer: str
    student_answer: str


@app.post("/api/teach")
def adaptive_teaching(request: TeachingRequest):

    try:

        # ==================================
        # STEP 1: EVALUATE STUDENT ANSWER
        # ==================================

        evaluation = evaluate_answer(
            question=request.question,
            correct_answer=request.correct_answer,
            student_answer=request.student_answer,
            lesson=request.lesson
        )

        # ==================================
        # EVALUATION ERROR PROTECTION
        # ==================================
        if evaluation.get("result") == "EVALUATION_ERROR" or evaluation.get("score") is None:
            return {
                "status": "evaluation_error",
                "evaluation": {
                    "result": "EVALUATION_ERROR",
                    "score": None,
                    "explanation": evaluation.get("explanation", "There was an error evaluating your answer. Please try again."),
                    "misconception": "",
                    "recommended_action": "RETRY"
                },
                "adaptive_decision": {
                    "action": "RETRY",
                    "message": "Evaluation failed. Difficulty and mastery were preserved.",
                    "difficulty": None
                },
                "reteach_content": "",
                "next_question": None
            }

        # ==================================
        # STEP 2: DETECT ADAPTIVE ACTION
        # ==================================

        adaptive_result = decide_next_action(
            score=evaluation["score"],
            result=evaluation["result"],
            misconception=evaluation.get("misconception", "")
        )

        action = adaptive_result["action"]
        next_difficulty = adaptive_result["difficulty"] or "Easy"

        # ==================================
        # STEP 3: RE-TEACH IF NEEDED
        # ==================================

        reteach_content = ""

        if action == "RETEACH":

            reteach_content = (
                "Let's review the concept again.\n\n"
                + evaluation["explanation"]
            )

        # ==================================
        # STEP 4: GENERATE NEXT QUESTION
        # ==================================

        next_question = None
        try:
            next_questions = generate_questions(
                topic=request.topic,
                lesson=request.lesson,
                level=request.level,
                difficulty=next_difficulty,
                number_of_questions=1
            )
            if next_questions.get("questions") and len(next_questions["questions"]) > 0:
                next_question = next_questions["questions"][0]
        except Exception as q_err:
            print(f"[adaptive_teaching] Next question generation skipped: {q_err}")

        # ==================================
        # STEP 5: RETURN ADAPTIVE RESPONSE
        # ==================================

        return {
            "status": "success",

            "evaluation": {
                "result": evaluation["result"],
                "score": evaluation["score"],
                "explanation": evaluation["explanation"],
                "misconception": evaluation.get("misconception", ""),
                "recommended_action": evaluation.get("recommended_action", "CONTINUE")
            },

            "adaptive_decision": {
                "action": action,
                "message": adaptive_result["message"],
                "difficulty": next_difficulty
            },

            "reteach_content": reteach_content,

            "next_question": next_question
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }