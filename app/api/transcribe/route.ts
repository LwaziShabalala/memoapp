import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

// Set the maximum file size to 25MB (OpenAI's maximum limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

// This is the new way to set config options in App Router
export const maxDuration = 60; // 60 seconds max duration for API function (Hobby plan limit)
export const dynamic = 'force-dynamic'; // Always run on-demand

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Transcribe API: Received request');
    
    // Get form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      console.error('❌ Transcribe API: No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    console.log(`📊 Transcribe API: Received file size: ${audioFile.size} bytes`);
    
    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      console.error('❌ Transcribe API: File too large', audioFile.size);
      return NextResponse.json({ 
        error: 'Audio file is too large. Maximum size is 25MB. The recording may need to be split into smaller segments.' 
      }, { status: 413 });
    }
    
    // Check for empty file
    if (audioFile.size === 0) {
      console.error('❌ Transcribe API: Empty audio file');
      return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
    }
    
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const fileName = `recording-${uuidv4()}.wav`;
    const filePath = join(tempDir, fileName);
    
    // Write the file to disk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`💾 Transcribe API: Saved temporary file to ${filePath}`);
    
    // Validate OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Transcribe API: Missing OpenAI API key');
      return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
    }
    
    // Create form data for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([buffer], { type: audioFile.type }), fileName);
    openaiFormData.append('model', 'whisper-1');
    
    console.log('🔄 Transcribe API: Sending request to OpenAI');
    
    // Send request to OpenAI with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout (safer than the full 60)
    
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: openaiFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check for response errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        
        console.error(`❌ Transcribe API: OpenAI API error (${response.status})`, errorData);
        return NextResponse.json(
          { 
            error: errorData.error?.message || `Failed to transcribe audio (${response.status})`,
            details: errorData
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      console.log('✅ Transcribe API: Successfully transcribed audio');
      
      // Format response as expected by frontend
      return NextResponse.json({ transcription: data.text });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError; // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error('❌ Error in transcribe API route:', error);
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
