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


def generate_lesson(topic, level, language, duration, style, context=""):
    prompt = f"""
You are an expert multilingual AI teacher and curriculum designer.

Create a personalized learning lesson using the following information:

Topic: {topic}
Student Level: {level}
Target Language: {language}
Duration: {duration} minutes
Teaching Style: {style}
Context / Sources: {context if context else 'General Knowledge'}

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
            model="gemini-1.5-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"[generate_lesson warning] Gemini API error: {e}")
        return f"# Error generating lesson\n\nThere was an error generating the lesson for {topic}. Please try again later."


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