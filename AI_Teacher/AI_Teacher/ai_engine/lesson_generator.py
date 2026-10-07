import os
from dotenv import load_dotenv
from google import genai
from ai_engine.rag_retriever import retrieve_relevant_context

# Load API key from .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def generate_lesson(topic, level, language, duration, style, context=""):
    # Apply RAG to extract only the most relevant parts of the uploaded document
    rag_context = retrieve_relevant_context(topic=topic, full_context=context, max_chars=8000)
    
    prompt = f"""
You are an expert multilingual AI teacher and curriculum designer.

Create a personalized learning lesson using the following information:

Topic: {topic}
Student Level: {level}
Target Language: {language}
Duration: {duration} minutes
Teaching Style: {style}
Context / Sources: {rag_context if rag_context else 'General Knowledge'}

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

    if not api_key:
        return "# Configuration Error\n\nAI service unavailable (credentials missing). Please configure GEMINI_API_KEY."

    models_to_try = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
    last_error = None

    for model_name in models_to_try:
        try:
            active_client = client or genai.Client(api_key=api_key)
            response = active_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response.text and len(response.text.strip()) > 0:
                return response.text
        except Exception as e:
            last_error = e
            print(f"[generate_lesson warning] Model {model_name} failed: {e}")

    return f"# Error generating lesson\n\nThere was an error generating the lesson for {topic}: {str(last_error or 'Service unavailable')}. Please try again."


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