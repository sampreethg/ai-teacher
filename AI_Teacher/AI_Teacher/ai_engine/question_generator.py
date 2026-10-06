import os
import json
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

class QuestionModel(BaseModel):
    question: str
    options: dict[str, str]
    correct_answer: str = Field(pattern="^[A-D]$")
    explanation: str

class QuestionListModel(BaseModel):
    questions: list[QuestionModel]


def generate_questions(
    topic,
    lesson,
    level,
    difficulty,
    number_of_questions=3
):
    prompt = f"""
You are an expert AI teacher.

Generate {number_of_questions} multiple-choice questions.

Topic: {topic}
Student Level: {level}
Difficulty: {difficulty}

Lesson:
{lesson}

Return ONLY valid JSON in exactly this structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": {{
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      }},
      "correct_answer": "A",
      "explanation": "Short explanation"
    }}
  ]
}}

Rules:
- Create exactly {number_of_questions} questions.
- Questions must be based on the lesson.
- There must be exactly one correct answer.
- correct_answer must contain only A, B, C, or D.
- Match the student's level and requested difficulty.
- Do not include Markdown.
- Do not include anything outside the JSON.
"""

    try:
        if not client:
            return {"error": "AI service unavailable (credentials missing)", "questions": []}

        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": QuestionListModel
            }
        )
        
        # Parse and validate with Pydantic
        raw_data = json.loads(response.text)
        validated = QuestionListModel.model_validate(raw_data)
        
        # Ensure correct_answer is actually a valid option key
        for q in validated.questions:
            if q.correct_answer not in q.options:
                raise ValueError(f"Correct answer '{q.correct_answer}' not in options.")
                
        return validated.model_dump()
    except Exception as e:
        print(f"[generate_questions warning] API/Validation error: {e}")
        return {"error": "An internal error occurred while generating questions.", "questions": []}


if __name__ == "__main__":

    lesson = """
    Newton's Second Law states:

    F = m × a

    When force increases while mass remains constant,
    acceleration increases.

    When mass increases while force remains constant,
    acceleration decreases.
    """

    questions = generate_questions(
        topic="Newton's Second Law",
        lesson=lesson,
        level="Beginner",
        difficulty="Easy",
        number_of_questions=3
    )

    print("\n========== STRUCTURED QUESTIONS ==========\n")

    for i, q in enumerate(questions["questions"], start=1):

        print(f"Question {i}:")
        print(q["question"])

        print("\nOptions:")
        for letter, option in q["options"].items():
            print(f"{letter}. {option}")

        print("\nCorrect Answer:", q["correct_answer"])
        print("Explanation:", q["explanation"])
        print("\n" + "-" * 50)