import os
import json
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Create Gemini client
client = genai.Client(api_key=api_key)


def evaluate_answer(question, correct_answer, student_answer, lesson):

    prompt = f"""
You are an AI teacher evaluating a student's answer.

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
    "result": "CORRECT or INCORRECT",
    "score": 0,
    "explanation": "Explain why the answer is correct or incorrect.",
    "misconception": "Describe the student's misunderstanding. Use empty string if there is no misconception.",
    "recommended_action": "CONTINUE, PRACTICE, RETEACH, or SIMPLIFY"
}}

Rules:
- score must be an integer from 0 to 100.
- If the student understands the concept, use CORRECT.
- If the student does not understand the concept, use INCORRECT.
- Identify the misconception when the answer is incorrect.
- Be educational and supportive.
- Do not include Markdown.
- Do not include anything outside the JSON object.
"""

    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
        )

        # Convert Gemini's JSON text into a Python dictionary
        evaluation = json.loads(response.text)
        return evaluation
    except Exception as e:
        print(f"[evaluate_answer warning] Gemini API error: {e}")
        return {
            "result": "ERROR",
            "score": 0,
            "explanation": "There was an error evaluating your answer. Please try again.",
            "misconception": "",
            "recommended_action": "CONTINUE"
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