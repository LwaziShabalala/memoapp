import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export const dynamic = 'force-dynamic'; // ✅ New Next.js 14+ config

export async function POST(req) {
  try {
    const formData = await req.formData(); // Convert request to FormData

    // Check if audio file exists
    const file = formData.get('audio');
    if (!file || !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file.' }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create new FormData
    const uploadData = new FormData();
    uploadData.append('audio', buffer, { filename: file.name || 'recording.wav', contentType: file.type });

    // Send to FastAPI server
    const response = await axios.post(
      'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict',
      uploadData,
      { headers: { ...uploadData.getHeaders() } }
    );

    // Return transcription result
    return NextResponse.json(response.data, { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);

    return NextResponse.json(
      { error: error.response?.data?.detail || 'Error processing audio file or transcription failed.' },
      { status: error.response?.status || 500 }
    );
  }
}
