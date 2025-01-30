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

// Define Next.js 14+ config
export const OPTIONS = {
  bodyParser: false, // Disable body parser as we're using multer
};

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    });
  }

  try {
    // Mock response object for multer middleware
    const res = {
      status: (code) => ({
        json: (obj) => new Response(JSON.stringify(obj), { status: code }),
      }),
    };

    // Handle file upload
    await runMiddleware(req, res, upload.single('audio'));

    // Check if we received a file
    if (!req.file || !req.file.mimetype.startsWith('audio/')) {
      console.log('Invalid file:', req.file ? req.file.mimetype : 'No file');
      return new Response(
        JSON.stringify({ error: 'File must be an audio file.' }),
        { status: 400 }
      );
    }

    // Create FormData from the memory buffer
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: 'recording.wav',
      contentType: 'audio/wav',
    });

    // Make request to FastAPI server
    const response = await axios.post(
      'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict',
      formData,
      { headers: formData.getHeaders() }
    );

    // Send transcription result back
    return new Response(JSON.stringify(response.data), { status: 200 });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'Error processing audio file or transcription failed.',
      }),
      { status: 500 }
    );
  }
}
