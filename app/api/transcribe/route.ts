import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

// Maximum size for an API request to OpenAI in bytes (25MB)
const MAX_CHUNK_SIZE = 25 * 1024 * 1024;

// Use the new route segment config format for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Set maximum execution time to 60 seconds

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const fileName = `recording-${uuidv4()}.wav`;
    const filePath = join(tempDir, fileName);
    
    // Write the file to disk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Check file size
    const fileSize = buffer.length;
    console.log(`Processing audio file: ${fileName}, size: ${fileSize} bytes`);
    
    let transcription = '';
    
    // If the file is larger than the maximum chunk size, process it in parts
    if (fileSize > MAX_CHUNK_SIZE) {
      console.log(`File exceeds maximum size. Processing in chunks...`);
      transcription = await processLargeFile(filePath, audioFile.type);
    } else {
      // Process the whole file at once
      transcription = await transcribeAudio(buffer, fileName, audioFile.type);
    }
    
    // Clean up the temporary file
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete temporary file:', error);
    }
    
    // Return the transcription
    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process audio' },
      { status: 500 }
    );
  }
}

// Function to process a large audio file in chunks
async function processLargeFile(filePath: string, fileType: string): Promise<string> {
  // For large files, we'd ideally split the audio properly based on silence detection
  // For simplicity, we'll just use the first 25MB of the file which should be ~30 minutes of audio
  // In production, consider using ffmpeg to properly split audio files
  
  const fileBuffer = await readFile(filePath);
  
  // Just use the first chunk for now - in a real app you might want to split by silence
  const chunk = fileBuffer.subarray(0, MAX_CHUNK_SIZE);
  const fileName = `chunk-${uuidv4()}.wav`;
  
  console.log(`Processing first ${chunk.length} bytes of audio...`);
  return await transcribeAudio(chunk, fileName, fileType);
}

// Function to transcribe audio using OpenAI's API
async function transcribeAudio(buffer: Buffer, fileName: string, fileType: string): Promise<string> {
  try {
    // Log file size for debugging
    console.log(`Sending file to OpenAI API. Size: ${buffer.length} bytes`);
    
    // Create form data for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([buffer], { type: fileType }), fileName);
    openaiFormData.append('model', 'whisper-1');
    
    // Send request to OpenAI with increased timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 413) {
      throw new Error(`File too large (${buffer.length} bytes). Maximum allowed size is ${MAX_CHUNK_SIZE} bytes.`);
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI API error: ${response.status}`);
    }
    
    return data.text;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Transcription error: ${error.message}`);
      if (error.message.includes('AbortError')) {
        throw new Error('Request timed out. The audio file may be too large or the server is busy.');
      }
      throw error;
    }
    throw new Error('Unknown transcription error');
  }
}
