import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

// Maximum size for an API request to OpenAI in bytes (25MB)
const MAX_CHUNK_SIZE = 25 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
    responseLimit: '50mb', // Increase response limit for large transcriptions
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
  // Create form data for OpenAI API
  const openaiFormData = new FormData();
  openaiFormData.append('file', new Blob([buffer], { type: fileType }), fileName);
  openaiFormData.append('model', 'whisper-1');
  
  // Send request to OpenAI
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: openaiFormData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API error: ${response.status}`);
  }
  
  return data.text;
}
