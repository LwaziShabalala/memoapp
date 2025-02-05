import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const app = express();
const PORT = 3001;

// Enable CORS for all origins (you can customize this for specific origins)
app.use(cors({
    origin: 'https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai' // Allow requests from your React app
}));

// Set up multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Setting destination for file storage...');
        cb(null, 'public/audio');  // Save audio files in the public/audio folder
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.wav';  // Default to .wav
        console.log('File received:', file.originalname);
        console.log('Storing file as: recording' + ext);
        cb(null, 'recording' + ext);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        // Log information about the uploaded file
        console.log('Audio file received:', req.file);

        // Ensure that the uploaded file is an audio file
        if (!req.file || !req.file.mimetype.startsWith('audio/')) {
            console.log('Uploaded file is not an audio file:', req.file ? req.file.mimetype : 'No file');
            return res.status(400).json({ error: 'File must be an audio file.' });
        }

        console.log('Audio file is correct.');

        // Read the audio file from disk
        const audioFilePath = req.file.path;
        console.log('Reading audio file from disk:', audioFilePath);
        const audioData = fs.readFileSync(audioFilePath);
        console.log('Audio data read successfully, size:', audioData.length);

        // Create a FormData object to send the audio file as multipart/form-data
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));
        console.log('FormData created, preparing to send to FastAPI...');

        // Update the URL to point to your local FastAPI server
        const response = await axios.post('http://localhost:8001/predict', formData, {
            headers: formData.getHeaders()  // Important: Set headers for form-data
        });

        console.log('Transcription response received from FastAPI server:', response.data);

        // Send the transcription result back to the client
        res.json(response.data);
    } catch (error) {
        console.log('Error during audio upload or transcription:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        } else {
            console.log('Error without response:', error);
        }
        res.status(500).json({ error: 'Error processing audio file or transcription failed.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
