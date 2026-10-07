import os
import json
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

class EvaluationModel(BaseModel):
    result: str = Field(pattern="^(CORRECT|INCORRECT|PARTIAL)$")
    score: int = Field(ge=0, le=100)
    explanation: str
    misconception: str = ""
    recommended_action: str = Field(pattern="^(CONTINUE|PRACTICE|RETEACH|SIMPLIFY|INCREASE_DIFFICULTY|RETRY)$")


def evaluate_answer(question, correct_answer, student_answer, lesson=""):
    if not api_key:
        return {
            "result": "EVALUATION_ERROR",
            "score": None,
            "explanation": "AI evaluation service unavailable (API credentials missing).",
            "misconception": "",
            "recommended_action": "RETRY"
        }

    prompt = f"""
You are an expert AI teacher evaluating a student's answer.

Lesson:
{lesson}

Question:
{question}

Correct Answer:
{correct_answer}

Student Answer:
{student_answer}

Evaluate the student's understanding.

Return ONLY valid JSON with exactly these fields:
{{
    "result": "CORRECT, INCORRECT, or PARTIAL",
    "score": 0,
    "explanation": "Clear pedagogical explanation of why the answer is correct, partially correct, or incorrect.",
    "misconception": "Describe the student's specific misunderstanding if incorrect. Empty string if no misconception.",
    "recommended_action": "CONTINUE, PRACTICE, RETEACH, or SIMPLIFY"
}}

Rules:
- score must be an integer from 0 to 100.
- If the student fully understands the concept and answered correctly, use CORRECT (score 80-100).
- If the student answered partially correctly or showed incomplete understanding, use PARTIAL (score 40-79).
- If the student answered incorrectly, use INCORRECT (score 0-39).
- Identify the specific misconception when the answer is incorrect.
- Be educational, encouraging, and supportive.
- Do not include Markdown.
- Do not include anything outside the JSON object.
"""

    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.8-flash"]
    last_error = None

    for model_name in models_to_try:
        try:
            active_client = client or genai.Client(api_key=api_key)
            response = active_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": EvaluationModel
                }
            )

            # Parse and validate with Pydantic
            raw_data = json.loads(response.text)
            validated = EvaluationModel.model_validate(raw_data)
            return validated.model_dump()
        except Exception as e:
            last_error = e
            print(f"[evaluate_answer warning] Model {model_name} failed: {e}")

    # If all models failed or threw an exception, return explicit EVALUATION_ERROR
    # CRITICAL: score MUST be None (never 0), result MUST be EVALUATION_ERROR (never INCORRECT)
    return {
        "result": "EVALUATION_ERROR",
        "score": None,
        "explanation": f"Evaluation service error: {str(last_error or 'Could not complete evaluation')}. Please try again.",
        "misconception": "",
        "recommended_action": "RETRY"
    }


if __name__ == "__main__":

    lesson = """
    Newton's Second Law states:

    F = m × a

    When force remains constant and mass increases,
    acceleration decreases.
    """

    question = """
    If the mass of an object increases while the force
    remains constant, what happens to its acceleration?
    """

    correct_answer = "Acceleration decreases."

    student_answer = "Acceleration increases."

    result = evaluate_answer(
        question=question,
        correct_answer=correct_answer,
        student_answer=student_answer,
        lesson=lesson
    )

    print("\n========== STRUCTURED EVALUATION ==========\n")

    print("Result:", result["result"])
    print("Score:", result["score"])
    print("Explanation:", result["explanation"])
    print("Misconception:", result["misconception"])
    print("Recommended Action:", result["recommended_action"])