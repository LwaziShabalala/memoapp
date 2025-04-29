import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

// Set the maximum file size to 25MB (OpenAI's maximum limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

export const config = {
  api: {
    bodyParser: false, // Disabling Next.js's body parser for file uploads
    responseLimit: '50mb', // Increased response size limit for large transcriptions
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'Audio file is too large. Maximum size is 25MB. The recording may need to be split into smaller segments.' 
      }, { status: 413 });
    }
    
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const fileName = `recording-${uuidv4()}.wav`;
    const filePath = join(tempDir, fileName);
    
    // Write the file to disk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Create form data for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([buffer], { type: audioFile.type }), fileName);
    openaiFormData.append('model', 'whisper-1');
    
    // Send request to OpenAI with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error?.message || `Failed to transcribe audio (${response.status})`,
          details: errorData
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Format response as expected by frontend
    return NextResponse.json({ transcription: data.text });
  } catch (error) {
    console.error('Error in transcribe API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process audio';
    const isAbortError = error instanceof DOMException && error.name === 'AbortError';
    
    return NextResponse.json(
      { 
        error: isAbortError ? 'Request timed out. The audio file may be too large.' : errorMessage 
      },
      { status: isAbortError ? 408 : 500 }
    );
  }
}
