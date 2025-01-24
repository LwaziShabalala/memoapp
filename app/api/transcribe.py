from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import torch
from transformers import pipeline
import io
from pydub import AudioSegment
import logging

# Initialize FastAPI app
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hugging Face Whisper API class
class HuggingFaceLitAPI:
    def setup(self, device):
        model_name = "distil-whisper/distil-large-v3"
        self.pipeline = pipeline(
            "automatic-speech-recognition",
            model=model_name,
            chunk_length_s=25,
            batch_size=16,
            device=device  # Use CPU for serverless or "cuda" if GPU is available
        )
        logger.info(f"Model '{model_name}' loaded on device: {device}")

    def predict(self, audio_data):
        logger.info("Running prediction...")
        return self.pipeline(audio_data)

# Initialize Hugging Face API
device = "cuda" if torch.cuda.is_available() else "cpu"
api = HuggingFaceLitAPI()
api.setup(device=device)

# Function to read and process audio file
def read_audio_file(uploaded_file: UploadFile):
    logger.info("Reading audio file...")
    audio_bytes = uploaded_file.file.read()

    try:
        with io.BytesIO(audio_bytes) as audio_io:
            # Process audio file using pydub
            logger.info("Processing audio...")
            audio = AudioSegment.from_file(audio_io)

            # Convert to mono and set frame rate to 16kHz
            logger.info("Converting to mono and adjusting frame rate...")
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)

            # Convert audio to numpy array
            logger.info("Converting audio to numpy array...")
            audio_array = np.array(audio.get_array_of_samples(), dtype=np.float32)
            audio_array = audio_array / np.max(np.abs(audio_array)) if np.max(np.abs(audio_array)) != 0 else audio_array

    except Exception as e:
        logger.error(f"Error during audio processing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing audio file: {str(e)}")

    return audio_array

# Route for predicting transcription from audio
@app.post("/predict")
async def transcribe_audio(audio: UploadFile = File(...)):
    logger.info(f"Received file: {audio.filename} with type: {audio.content_type}")

    # Validate uploaded file
    if audio.content_type is None or not audio.content_type.startswith('audio/'):
        logger.error(f"Invalid file type: {audio.content_type}")
        raise HTTPException(status_code=400, detail="File must be an audio file.")

    # Read and process audio file
    logger.info("Reading and processing audio file...")
    audio_data = read_audio_file(audio)

    try:
        # Call the Whisper model to transcribe the audio
        logger.info("Calling transcription model...")
        transcription = api.predict(audio_data)

        # Extract transcription text
        if isinstance(transcription, dict) and 'text' in transcription:
            transcription_text = transcription['text']
            logger.info("Transcription successful!")
        else:
            transcription_text = "No transcription available."
            logger.warning("No transcription available.")

    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transcription: {str(e)}")

    return {"transcription": transcription_text}

# Start the server
if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
