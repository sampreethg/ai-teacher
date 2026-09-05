import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'No valid file found in request payload.' },
        { status: 400 }
      );
    }

    const fileName = (file as any).name || 'uploaded_document.pdf';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      // Require lib/pdf-parse.js directly to avoid pdf-parse's index.js debug block (which triggers on Next.js bundling)
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
      // Plain text, markdown, or text-encoded documents
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to extract text from document.'
      },
      { status: 500 }
    );
  }
}
