import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
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
    const fileName = recording-${uuidv4()}.wav;
    const filePath = join(tempDir, fileName);
    // Write the file to disk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(filePath, buffer);
    // Create form data for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append('file', new Blob([buffer], { type: audioFile.type }), fileName);
    openaiFormData.append('model', 'whisper-1');
    // Send request to OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': Bearer ${process.env.OPENAI_API_KEY},
      },
      body: openaiFormData,
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to transcribe audio' },
        { status: response.status }
      );
    }
    // Format response as expected by frontend
    return NextResponse.json({ transcription: data.text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process audio' },
      { status: 500 }
    );
  }
}
