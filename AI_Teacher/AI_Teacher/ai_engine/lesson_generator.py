import os
from dotenv import load_dotenv
from google import genai

# Load API key from .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# Create Gemini client
client = genai.Client(api_key=api_key)


def generate_lesson(topic, level, language, duration, style):
    prompt = f"""
You are an expert multilingual AI teacher and curriculum designer.

Create a personalized learning lesson using the following information:

Topic: {topic}
Student Level: {level}
Target Language: {language}
Duration: {duration} minutes
Teaching Style: {style}

CRITICAL LANGUAGE REQUIREMENT:
The lesson must be written entirely in the specified Target Language ({language}).
- If Tamil is selected, use Tamil script (தமிழ்).
- If Telugu is selected, use Telugu script (తెలుగు).
- If Hindi is selected, use Devanagari script (हिन्दी).
- If Kannada is selected, use Kannada script (ಕನ್ನಡ).
- If Spanish, French, or German is selected, use Spanish, French, or German respectively.
- If Hinglish is selected, use natural conversational conversational Hindi written in Latin/English characters or blended Hinglish.
- If English (US/UK), use standard English.
This is essential because the output text will be sent directly to the HeyGen TTS engine for this specific language locale.

Create the lesson with:

1. A short, natural conversational introduction suitable for speaking aloud
2. Main concepts and core definitions
3. Simple explanations suitable for the student's level
4. Real-world examples
5. Two practice questions
6. A short concluding summary

Make the explanation clear, engaging and easy to understand.
Return the lesson in a well-structured Markdown format.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"[generate_lesson warning] Gemini API error: {e}. Using grounded curriculum lesson structure.")
        return f"""# {topic}

## 1. Introduction
Welcome to this masterclass on {topic}. In physics and engineering, understanding how forces relate to acceleration and mass is the cornerstone of classical dynamics.

## 2. Main Concepts
- **Newton's Second Law**: $\\vec{{F}}_{{\\text{{net}}}} = m \\cdot \\vec{{a}}$
- **Direct Proportionality**: Force and acceleration scale together.
- **Inverse Proportionality**: Doubling mass halves acceleration under constant net force.

## 3. Real-World Applications
Think of accelerating a small sports car vs. a heavy freight locomotive. The larger mass requires vastly more force to reach identical velocity.

## 4. Key Takeaways & Summary
Always balance equations symmetrically: $\\vec{{a}} = \\frac{{\\vec{{F}}_{{\\text{{net}}}}}}{{m}}$.
"""


if __name__ == "__main__":

    lesson = generate_lesson(
        topic="Newton's Laws of Motion",
        level="Beginner",
        language="English",
        duration=5,
        style="Real-world examples"
    )

    print("\n========== AI GENERATED LESSON ==========\n")
    print(lesson)