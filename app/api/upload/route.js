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

export const config = {
  api: {
    bodyParser: false, // Disable body parser as we're using multer
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle file upload
    await runMiddleware(req, res, upload.single('audio'));

    // Check if we received a file
    if (!req.file || !req.file.mimetype.startsWith('audio/')) {
      console.log('Invalid file:', req.file ? req.file.mimetype : 'No file');
      return res.status(400).json({ error: 'File must be an audio file.' });
    }

    // Create FormData from the memory buffer
    const formData = new FormData();
    formData.append('audio', req.file.buffer, {
      filename: 'recording.wav',
      contentType: 'audio/wav'
    });

    // Make request to FastAPI server
    const response = await axios.post(
      'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict',
      formData,
      { headers: formData.getHeaders() }
    );

    // Send transcription result back
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Error processing audio file or transcription failed.'
    });
  }
}
