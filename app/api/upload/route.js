import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic'; // ✅ Next.js 14+ config

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio');

    if (!file || !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Fix: Use Blob to correctly send file
    const uploadData = new FormData();
    uploadData.append('audio', new Blob([buffer], { type: file.type }), file.name || 'recording.wav');

    // ✅ Fix: Explicit headers for FormData
    const response = await axios.post(
      'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict',
      uploadData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return NextResponse.json(response.data, { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Error processing audio file or transcription failed.' },
      { status: error.response?.status || 500 }
    );
  }
}
