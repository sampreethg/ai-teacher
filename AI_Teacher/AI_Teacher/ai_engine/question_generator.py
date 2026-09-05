import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)


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

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        }
    )

    return json.loads(response.text)


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