import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[API /api/upload] CRITICAL: NEXTAUTH_SECRET is missing in environment variables.');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: NEXTAUTH_SECRET environment variable is required.' },
        { status: 500 }
      );
    }

    const token = await getToken({ req: request, secret });
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    // 2. Rate Limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const userLimit = rateLimit.get(ip);
    if (!userLimit || now > userLimit.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else if (userLimit.count >= MAX_REQUESTS) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    } else {
      userLimit.count += 1;
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'No valid file found.' }, { status: 400 });
    }

    const fileName = (file as any).name || 'uploaded_document.pdf';
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    // 3. File Restrictions
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PDF, TXT, and MD are allowed.' }, { status: 415 });
    }

    // 4. Size Limits
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 5MB limit.' }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      let pdfParse;
      try {
        pdfParse = require('pdf-parse/lib/pdf-parse.js');
      } catch {
        pdfParse = require('pdf-parse');
      }

      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(buffer);
        extractedText = (pdfData && pdfData.text) ? pdfData.text.trim() : '';
      } else if (pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = (result && result.text) ? result.text.trim() : '';
      } else if (typeof pdfParse.default === 'function') {
        const pdfData = await pdfParse.default(buffer);
        extractedText = (pdfData && pdfData.text) ? pdfData.text.trim() : '';
      } else {
        throw new Error('Unsupported PDF parsing format.');
      }
    } else {
      extractedText = buffer.toString('utf-8').trim();
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName,
      size: buffer.length
    });
  } catch (error: any) {
    console.error('[API /api/upload] Error extracting text from document:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to extract text from document.' }, { status: 500 });
  }
}
