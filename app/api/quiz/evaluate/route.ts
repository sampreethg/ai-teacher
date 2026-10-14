import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { topic = '', question = '', correct_answer = '', student_answer = '', lesson = '' } = body;

    // 1. Try FastAPI backend first
    try {
      const pythonRes = await fetch('http://localhost:8000/api/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level: 'Beginner',
          question,
          correct_answer,
          student_answer,
          lesson: lesson || `${topic} lesson notes`
        }),
        signal: AbortSignal.timeout(3500)
      });

      if (pythonRes.ok) {
        const pythonData = await pythonRes.json();
        if (pythonData.evaluation) {
          return NextResponse.json(pythonData);
        }
      }
    } catch {
      // Python backend offline, proceed to Gemini fallback
    }

    // 2. Direct Socratic Gemini Evaluation
    const isCorrect = student_answer.trim().toLowerCase() === correct_answer.trim().toLowerCase() ||
                      student_answer.trim().startsWith(correct_answer.trim());

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const prompt = `You are a supportive, insightful AI Socratic Teacher in a live classroom.
Evaluate the student's answer to this question:

Topic: ${topic}
Question: "${question}"
Correct Answer: "${correct_answer}"
Student's Selected Answer: "${student_answer}"

Output ONLY a JSON object:
{
  "result": "${isCorrect ? 'CORRECT' : 'INCORRECT'}",
  "score": ${isCorrect ? 100 : 0},
  "explanation": "2-3 sentences of supportive Socratic feedback explaining why this is ${isCorrect ? 'correct' : 'incorrect'} and reinforcing the core principle.",
  "misconception": "${isCorrect ? '' : 'Brief diagnosis of why the student might have chosen this option'}",
  "recommended_action": "${isCorrect ? 'Proceed to advanced practice' : 'Review fundamental derivations'}"
}`;

        const geminiRes = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(geminiRes.text || '{}');
        return NextResponse.json({
          status: 'success',
          evaluation: {
            result: parsed.result || (isCorrect ? 'CORRECT' : 'INCORRECT'),
            score: parsed.score ?? (isCorrect ? 100 : 0),
            explanation: parsed.explanation || (isCorrect ? 'Excellent job! Your understanding of the fundamental principles is solid.' : 'Not quite. Remember how force and acceleration are directly related.'),
            misconception: parsed.misconception || undefined,
            recommended_action: parsed.recommended_action || undefined
          },
          reteach_content: isCorrect ? '' : `Remember: In ${topic}, direct relations govern that when the numerator increases, the resultant vector increases in lockstep.`
        });
      } catch (err) {
        console.warn('[Quiz Evaluate API] Gemini evaluation failed:', err);
      }
    }

    // 3. Resilient Built-in Evaluation
    return NextResponse.json({
      status: 'success',
      evaluation: {
        result: isCorrect ? 'CORRECT' : 'INCORRECT',
        score: isCorrect ? 100 : 0,
        explanation: isCorrect
          ? `Outstanding! You correctly identified that in ${topic}, acceleration is directly proportional to net force.`
          : `That is not quite right. In ${topic}, force and acceleration increase together while mass is held constant.`,
        misconception: isCorrect ? undefined : 'Confusing inverse proportionality with direct proportionality in F = m · a.'
      },
      reteach_content: isCorrect ? '' : `Recall: a = F / m. If force F doubles and mass m stays the same, acceleration a must also double.`
    });
  } catch (error: any) {
    console.error('[Quiz Evaluate API] Error:', error);
    return NextResponse.json({ error: error.message || 'Evaluation failed.' }, { status: 500 });
  }
}
