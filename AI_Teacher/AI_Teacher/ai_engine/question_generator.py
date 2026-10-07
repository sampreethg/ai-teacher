import os
import json
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

class QuestionOptions(BaseModel):
    A: str
    B: str
    C: str
    D: str

class QuestionModel(BaseModel):
    question: str
    options: QuestionOptions
    correct_answer: str = Field(pattern="^[A-D]$")
    explanation: str

class QuestionListModel(BaseModel):
    questions: list[QuestionModel]


def validate_question_data(q_dict, allowed_difficulty="Easy"):
    """
    Strict validation of generated question according to specification:
    - Question exists and non-empty string
    - Options exist with exactly A, B, C, D
    - Options are non-empty strings and not all identical
    - Correct answer exists and corresponds to one of the options
    - Required fields exist
    - Difficulty has allowed value
    """
    if not isinstance(q_dict, dict):
        raise ValueError("Question data must be a dictionary")

    q_text = q_dict.get("question")
    if not q_text or not isinstance(q_text, str) or len(q_text.strip()) < 5:
        raise ValueError("Question text must be a non-empty string with at least 5 characters")

    options = q_dict.get("options")
    if not isinstance(options, dict):
        raise ValueError("Options must be a dictionary with keys A, B, C, D")

    for opt_key in ["A", "B", "C", "D"]:
        if opt_key not in options:
            raise ValueError(f"Option key '{opt_key}' is missing")
        val = options[opt_key]
        if not val or not isinstance(val, str) or len(val.strip()) == 0:
            raise ValueError(f"Option '{opt_key}' value must be a non-empty string")

    # Verify options are not all identical duplicates
    opt_values = [options[k].strip().lower() for k in ["A", "B", "C", "D"]]
    if len(set(opt_values)) < 2:
        raise ValueError("Options contain duplicate values; questions must have distinct choices")

    correct_answer = q_dict.get("correct_answer")
    if correct_answer not in ["A", "B", "C", "D"]:
        raise ValueError(f"Correct answer '{correct_answer}' must be one of A, B, C, D")

    explanation = q_dict.get("explanation")
    if not explanation or not isinstance(explanation, str) or len(explanation.strip()) == 0:
        raise ValueError("Explanation must be a non-empty string")

    diff = q_dict.get("difficulty", allowed_difficulty)
    if diff not in ["Easy", "Medium", "Hard"]:
        diff = allowed_difficulty
    q_dict["difficulty"] = diff

    return True


def generate_questions(
    topic,
    lesson,
    level="Beginner",
    difficulty="Easy",
    number_of_questions=1
):
    if not lesson or len(lesson.strip()) < 10:
        return {
            "status": "error",
            "error": "Valid lesson content is required as the source for quiz generation.",
            "questions": []
        }

    if not api_key:
        return {
            "status": "error",
            "error": "AI service unavailable (credentials missing).",
            "questions": []
        }

    prompt = f"""
You are an expert AI teacher and curriculum assessor.

Generate {number_of_questions} high-quality multiple-choice questions grounded STRICTLY in the following lesson:

Topic: {topic}
Student Level: {level}
Difficulty: {difficulty}

Lesson Content (Canonical Source):
{lesson}

Return ONLY valid JSON in exactly this structure:
{{
  "questions": [
    {{
      "question": "Question text based on the lesson",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct_answer": "A",
      "explanation": "Clear explanation grounded in the lesson"
    }}
  ]
}}

Rules:
- Generate exactly {number_of_questions} question(s).
- All questions MUST be directly grounded in the provided lesson content.
- Options must be distinct, plausible, and well-written.
- Exactly one option must be correct.
- correct_answer must be only 'A', 'B', 'C', or 'D'.
- Do not include Markdown blocks or text outside the JSON object.
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
                    "response_schema": QuestionListModel
                }
            )

            raw_data = json.loads(response.text)
            validated = QuestionListModel.model_validate(raw_data)
            dumped = validated.model_dump()

            # Strict Section 8 Validation
            validated_questions = []
            for q in dumped.get("questions", []):
                validate_question_data(q, allowed_difficulty=difficulty)
                validated_questions.append(q)

            if not validated_questions:
                raise ValueError("No questions were generated by the AI model.")

            return {
                "status": "success",
                "topic": topic,
                "difficulty": difficulty,
                "questions": validated_questions
            }
        except Exception as e:
            last_error = e
            print(f"[generate_questions warning] Model {model_name} failed: {e}")

    return {
        "status": "error",
        "error": f"Failed to generate valid quiz from lesson: {str(last_error or 'Unknown error')}",
        "questions": []
    }


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