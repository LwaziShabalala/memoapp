import { NextResponse } from 'next/server';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to handle multer upload
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Keep API configuration for Next.js
export const config = {
  api: {
    bodyParser: false, // Disable body parser as we're using multer
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData(); // Convert incoming request to FormData

    // Check if audio file exists
    const file = formData.get('audio');
    if (!file || !file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file.' }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create new FormData
    const uploadData = new FormData();
    uploadData.append('audio', buffer, { filename: 'recording.wav', contentType: 'audio/wav' });

    // Send to FastAPI server
    const response = await axios.post(
      'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict',
      uploadData,
      { headers: uploadData.getHeaders() }
    );

    // Return transcription result
    return NextResponse.json(response.data, { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Error processing audio file or transcription failed.' }, { status: 500 });
  }
}
