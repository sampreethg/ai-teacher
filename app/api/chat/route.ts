import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'A valid message string is required.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if GEMINI_API_KEY is not configured yet
    if (!apiKey) {
      console.warn('[API /api/chat] GEMINI_API_KEY is not configured in the environment. Returning simulated grounded response.');
      return NextResponse.json({
        response: `Based on your active learning sources, here is an educational breakdown of "${message.trim()}":\n\n` +
          `1. **Core Concept**: In educational and system architectures, strict boundary separation ensures integrity and deterministic execution.\n\n` +
          `2. **Key Insight**: Always verify token contracts, cryptographic proof handshakes (such as PKCE or TLS session binding), and concurrency models before deployment.\n\n` +
          `3. **Next Steps**: You can explore the interactive **Video Lesson** in the AI Classroom to see real-time derivations and test your understanding with Socratic checkpoints.\n\n` +
          `*(Note: To connect live to the Gemini API, set your \`GEMINI_API_KEY\` in the environment.)*`
      });
    }

    // Initialize Google Gen AI client
    const client = new GoogleGenAI({ apiKey });

    // Format conversation history for Gemini multi-turn generation
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        const text = (item.text || item.content || '').trim();
        if (!text) continue;

        const role = (item.role === 'user' || item.sender === 'user') ? 'user' : 'model';

        // Gemini requires multi-turn contents to begin with a 'user' turn
        if (formattedContents.length === 0 && role === 'model') {
          continue;
        }

        // Avoid consecutive duplicate roles if any
        if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
          formattedContents[formattedContents.length - 1].parts[0].text += `\n\n${text}`;
        } else {
          formattedContents.push({
            role,
            parts: [{ text }]
          });
        }
      }
    }

    // Append the new user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: 'You are an AI Teacher and Research Assistant in an interactive educational learning studio. Provide clear, structured, pedagogical explanations with Markdown formatting, bullet points, and key derivations grounded in educational materials.'
      }
    });

    const aiResponseText = response.text || 'I could not generate a response at this time.';

    return NextResponse.json({
      response: aiResponseText
    });
  } catch (error: any) {
    console.error('[API /api/chat] Error generating chat response with Gemini:', error);
    return NextResponse.json(
      {
        response: `I encountered an issue connecting to the AI Teacher service: ${error.message || 'Internal error'}. Please verify your connection or GEMINI_API_KEY.`,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
