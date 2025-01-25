from fastapi import FastAPI, UploadFile, File, HTTPException
import numpy as np
import torch
from transformers import pipeline
import uvicorn
import io
from pydub import AudioSegment

app = FastAPI()

class HuggingFaceLitAPI:
    def setup(self, device):
        # Use the Whisper model from HuggingFace's pipeline
        model_name = "openai/whisper-small"
        self.pipeline = pipeline(
            "automatic-speech-recognition", 
            model=model_name, 
            chunk_length_s=25,   # Chunk size for long audios
            batch_size=16,       # Batch size for processing
            device=device        # Use GPU if available
        )
        print(f"Model '{model_name}' loaded on device: {device}")

    def predict(self, audio_data):
        print("Running prediction...")
        return self.pipeline(audio_data)

# Initialize the Hugging Face API
api = HuggingFaceLitAPI()
api.setup(device="cuda" if torch.cuda.is_available() else "cpu")

# Function to read and process audio file
def read_audio_file(uploaded_file: UploadFile):
    print("Reading audio file...")
    audio_bytes = uploaded_file.file.read()

    try:
        with io.BytesIO(audio_bytes) as audio_io:
            # Read the audio file
            print("Processing audio...")
            audio = AudioSegment.from_file(audio_io)
            
            # Convert to mono and set frame rate to 16kHz
            print("Converting to mono and adjusting frame rate...")
            audio = audio.set_channels(1)
            audio = audio.set_frame_rate(16000)
            
            # Convert audio to numpy array
            print("Converting audio to numpy array...")
            audio_array = np.array(audio.get_array_of_samples(), dtype=np.float32)
            audio_array = audio_array / np.max(np.abs(audio_array)) if np.max(np.abs(audio_array)) != 0 else audio_array

    except Exception as e:
        print(f"Error during audio processing: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing audio file: {str(e)}")

    return audio_array

# Route for predicting transcription from audio
@app.post("/predict")
async def transcribe_audio(audio: UploadFile = File(...)):
    print(f"Received file: {audio.filename} with type: {audio.content_type}")

    # Check if the uploaded file is a valid audio file
    if audio.content_type is None or not audio.content_type.startswith('audio/'):
        print(f"Invalid file type: {audio.content_type}")
        raise HTTPException(status_code=400, detail="File must be an audio file.")
    
    # Read and process the audio file
    print("Reading and processing audio file...")
    audio_data = read_audio_file(audio)

    try:
        # Call the Whisper model to transcribe the audio
        print("Calling transcription model...")
        transcription = api.predict(audio_data)
        
        # Extract transcription text
        if isinstance(transcription, dict) and 'text' in transcription:
            transcription_text = transcription['text']
            print("Transcription successful!")
        else:
            transcription_text = "No transcription available."
            print("No transcription available.")
    
    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transcription: {str(e)}")

    return {"transcription": transcription_text}

# Start the server
if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)