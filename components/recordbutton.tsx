"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Mic } from "lucide-react";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "@/app/transcriptioncontext";
import { useLoading } from "../app/(dashboard)/loadingcontext";

const RecordButton: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const { setFilename, setTranscription } = useTranscription();
    const { setIsProcessing } = useLoading();

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isRecording) {
            console.log("🔴 Recording started...");
            setError(null);
            audioChunksRef.current = [];
            setRecordingTime(0);
            
            // Start the timer to track recording duration
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            // Set up audio recording with lower quality for smaller file size
            navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1, // Mono recording
                    sampleRate: 16000 // Lower sample rate (16kHz is enough for speech)
                } 
            })
            .then((stream) => {
                console.log("🎤 Microphone access granted.");
                // Use a more compressed format if possible
                const options = { 
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 32000 // Lower bitrate for smaller file size
                };
                
                try {
                    const mediaRecorder = new MediaRecorder(stream, options);
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                            console.log("🔊 Audio chunk recorded:", event.data.size, "bytes");
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        try {
                            console.log("🛑 Recording stopped. Processing audio...");
                            
                            if (timerRef.current) {
                                clearInterval(timerRef.current);
                                timerRef.current = null;
                            }
                            
                            setIsProcessing(true);
                            
                            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                            console.log("📁 Audio blob created:", audioBlob.size, "bytes");
                            
                            // Check file size before sending (OpenAI limit is 25MB)
                            const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB in bytes
                            if (audioBlob.size > MAX_AUDIO_SIZE) {
                                throw new Error(`Audio file size (${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed size (25MB).`);
                            }

                            const formData = new FormData();
                            formData.append("file", new File([audioBlob], "recording.webm", { type: "audio/webm" }));
                            
                            console.log("📡 Sending audio file to API route...");

                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

                            const response = await fetch("/api/transcribe", {
                                method: "POST",
                                body: formData,
                                signal: controller.signal
                            });

                            clearTimeout(timeoutId);

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Server error (${response.status}): ${errorText}`);
                            }

                            const result = await response.json();
                            console.log("✅ Transcription received:", result.transcription);
                            setTranscription(result.transcription);
                            setShowFilenameModal(true);
                        } catch (error) {
                            console.error("❌ Error processing recording:", error);
                            let errorMessage = "Failed to process recording. ";
                            
                            if (error instanceof TypeError && error.message.includes("fetch")) {
                                errorMessage += "Could not connect to API. Please check your internet connection.";
                            } else if (error instanceof DOMException && error.name === "AbortError") {
                                errorMessage += "Request timed out. Please try recording a shorter message.";
                            } else {
                                errorMessage += error instanceof Error ? error.message : "Unknown error occurred.";
                            }
                            
                            setError(errorMessage);
                        } finally {
                            setIsProcessing(false);
                            audioChunksRef.current = [];
                        }
                    };

                    // Request data every 1 second instead of waiting until stop
                    mediaRecorder.start(1000);
                } catch (error) {
                    console.error("❌ Error creating MediaRecorder:", error);
                    setError("Your browser doesn't support the audio format. Please try using Chrome or Edge.");
                    setIsRecording(false);
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                }
            })
            .catch((error) => {
                console.error("❌ Error accessing microphone:", error);
                setError("Failed to access microphone. Please ensure microphone permissions are granted.");
                setIsRecording(false);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            });
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            console.log("🛑 Stopping recording...");
            mediaRecorderRef.current.stop();
            
            // Stop all tracks on the stream
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
        }
    }, [isRecording, setTranscription, setIsProcessing]);

    const handleSave = (filename: string) => {
        console.log("💾 Saving filename:", filename);
        setFilename(filename);
        setShowFilenameModal(false);
    };

    // Format recording time as MM:SS
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={() => {
                    console.log("🎤 Toggling recording:", !isRecording);
                    setIsRecording((prev) => !prev);
                }}
                className={`p-6 border-black/5 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer w-40 h-40 ${isRecording ? 'bg-red-50' : 'bg-gray-50'}`}
            >
                <div className={`p-4 w-fit h-fit rounded-full ${isRecording ? 'bg-red-500/10 animate-pulse' : 'bg-violet-500/10'}`}>
                    <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500' : 'text-violet-500'}`} />
                </div>
                <div className="font-semibold mt-4 text-black">
                    {isRecording ? `Recording ${formatTime(recordingTime)}` : "Record"}
                </div>
            </Card>
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md max-w-md text-center">
                    {error}
                </div>
            )}
            <FilenameModal
                open={showFilenameModal}
                onClose={() => setShowFilenameModal(false)}
                onSave={handleSave}
            />
        </div>
    );
};

export default RecordButton;
