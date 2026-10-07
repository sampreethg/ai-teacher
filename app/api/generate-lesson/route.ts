import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfText, topic } = body;

    if (!pdfText && !topic) {
      return NextResponse.json(
        { error: 'At least pdfText or a topic must be provided in the request body.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[API /api/generate-lesson] GEMINI_API_KEY is not configured in the environment. Returning simulated lesson chunks.');
      return NextResponse.json([
        {
          spoken_text: `Welcome to this interactive lesson on ${topic || 'the selected topic'}! Let's derive the fundamental mathematical relations from your uploaded course materials.`,
          visual_content: '\\mathbf{F}_{\\text{net}} = m \\cdot \\mathbf{a}'
        },
        {
          spoken_text: `Notice that the net acceleration is directly proportional to the applied force vector, and inversely proportional to the inertial mass.`,
          visual_content: '\\mathbf{a} = \\frac{\\mathbf{F}_{\\text{net}}}{m}'
        },
        {
          spoken_text: `Now, let us test your comprehension through an active Socratic checkpoint before moving on to work-energy derivations.`,
          visual_content: 'W = \\int_{\\mathbf{r}_1}^{\\mathbf{r}_2} \\mathbf{F} \\cdot d\\mathbf{r} = \\Delta E_k'
        }
      ]);
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an AI Teacher. Based on this text, generate a JSON array of lesson chunks. Each chunk must have a \`spoken_text\` field (what the teacher says) and a \`visual_content\` field (a KaTeX equation or brief summary to show on screen).

Topic:
${topic || 'General Topic Overview'}

Source Material:
${pdfText || 'Teach the core principles and derivations of the specified topic.'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '[]';
    let lessonChunks = [];

    try {
      lessonChunks = JSON.parse(responseText);
    } catch (parseError) {
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      lessonChunks = JSON.parse(cleaned);
    }

    return NextResponse.json(lessonChunks);
  } catch (error: any) {
    console.error('[API /api/generate-lesson] Error generating lesson with Gemini:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate lesson from Gemini.' },
      { status: 500 }
    );
  }
}
