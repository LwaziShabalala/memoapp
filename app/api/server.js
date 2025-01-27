import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const app = express();
const PORT = process.env.PORT || 3001;

// Update CORS for production
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://your-vercel-app-url.vercel.app'  // Replace with your Vercel URL
        : 'http://localhost:3000'
}));

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        // Check if we received a file
        if (!req.file || !req.file.mimetype.startsWith('audio/')) {
            console.log('Invalid file:', req.file ? req.file.mimetype : 'No file');
            return res.status(400).json({ error: 'File must be an audio file.' });
        }

        // Create FormData directly from the memory buffer
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
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Error processing audio file or transcription failed.' 
        });
    }
});

// Only start server if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Development server running on http://localhost:${PORT}`);
    });
}

// Required for Vercel
export default app;