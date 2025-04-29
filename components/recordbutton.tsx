"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Mic, StopCircle, AlertTriangle } from "lucide-react";
import WavEncoder from "wav-encoder";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "@/app/transcriptioncontext";
import { useLoading } from "../app/(dashboard)/loadingcontext";

const RecordButton: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Max recording duration in minutes (3 hours = 180 minutes)
    const MAX_RECORDING_DURATION_MINUTES = 180;
    const MAX_RECORDING_DURATION = MAX_RECORDING_DURATION_MINUTES * 60;
    
    // Warning threshold in minutes (show warning at 2 hours = 120 minutes)
    const WARNING_THRESHOLD_MINUTES = 120;
    const WARNING_THRESHOLD = WARNING_THRESHOLD_MINUTES * 60;
    
    // File size warning threshold (20MB)
    const FILE_SIZE_WARNING_THRESHOLD = 20 * 1024 * 1024;
    
    // Audio settings optimized for lectures
    const AUDIO_SAMPLE_RATE = 16000; // 16kHz is sufficient for speech clarity while reducing file size
    const AUDIO_CHANNELS = 1;        // Mono is sufficient for lectures
    const AUDIO_BIT_DEPTH = 16;      // Standard bit depth for clear audio

    const { setFilename, setTranscription } = useTranscription();
    const { setIsProcessing } = useLoading();

    // Format time display (MM:SS or HH:MM:SS)
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Clean up resources
    const cleanupRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
        }
    };

    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            cleanupRecording();
        };
    }, []);

    useEffect(() => {
        if (isRecording) {
            console.log("🔴 Recording started...");
            setError(null);
            setWarning(null);
            setRecordingDuration(0);
            audioChunksRef.current = [];
            
            // Setup timer to track recording duration
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    
                    // Show warning when approaching max duration
                    if (newDuration === WARNING_THRESHOLD) {
                        setWarning(`Recording approaching ${WARNING_THRESHOLD_MINUTES} minutes. Max duration is ${MAX_RECORDING_DURATION_MINUTES} minutes.`);
                    }
                    
                    // Auto-stop recording if it exceeds max duration
                    if (newDuration >= MAX_RECORDING_DURATION) {
                        console.log("⏱️ Maximum recording duration reached");
                        setIsRecording(false);
                    }
                    
                    return newDuration;
                });
            }, 1000);

            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                    sampleRate: AUDIO_SAMPLE_RATE
                });

                navigator.mediaDevices.getUserMedia({ 
                    audio: { 
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                })
                .then((stream) => {
                    console.log("🎤 Microphone access granted");
                    streamRef.current = stream;
                    
                    const mediaRecorder = new MediaRecorder(stream, {
                        audioBitsPerSecond: AUDIO_SAMPLE_RATE * AUDIO_BIT_DEPTH * AUDIO_CHANNELS,
                        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                            ? 'audio/webm;codecs=opus'   // Opus codec has better compression for speech
                            : 'audio/webm'
                    });
                    
                    mediaRecorderRef.current = mediaRecorder;
                    let totalSize = 0;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                            totalSize += event.data.size;
                            console.log(`🔊 Audio chunk recorded: ${event.data.size} bytes (Total: ${totalSize} bytes)`);
                            
                            // Warn if file is getting too large
                            if (totalSize > FILE_SIZE_WARNING_THRESHOLD && !warning) {
                                setWarning("Recording is getting large. Consider stopping soon to avoid exceeding size limits.");
                            }
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        try {
                            console.log("🛑 Recording stopped. Processing audio...");
                            setIsProcessing(true);
                            
                            if (audioChunksRef.current.length === 0) {
                                throw new Error("No audio data recorded");
                            }
                            
                            const audioBlob = new Blob(audioChunksRef.current, { 
                                type: mediaRecorder.mimeType
                            });
                            console.log(`📁 Audio blob created: ${audioBlob.size} bytes`);

                            // Check if file is too large before processing
                            if (audioBlob.size > 25 * 1024 * 1024) {
                                throw new Error("Recording exceeds 25MB limit. Try a shorter recording.");
                            }

                            const audioArrayBuffer = await audioBlob.arrayBuffer();
                            console.log("🔄 Converting blob to array buffer...");

                            const audioBuffer = await audioContextRef.current?.decodeAudioData(audioArrayBuffer);
                            if (!audioBuffer) {
                                throw new Error("Failed to decode audio data");
                            }

                            console.log("✅ Audio successfully decoded. Encoding to WAV...");
                            
                            // Converting to WAV with lower quality settings to reduce file size
                            const wavData = await WavEncoder.encode({
                                sampleRate: audioBuffer.sampleRate,
                                channelData: [audioBuffer.getChannelData(0)],
                            });

                            const wavBlob = new Blob([wavData], { type: "audio/wav" });
                            console.log(`📀 WAV file created: ${wavBlob.size} bytes`);

                            const formData = new FormData();
                            formData.append("file", new File([wavBlob], "recording.wav", { type: "audio/wav" }));
                            
                            console.log("📡 Sending audio file to API route...");

                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for large files

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
                                errorMessage += "Request timed out. The file may be too large for processing.";
                            } else {
                                errorMessage += error instanceof Error ? error.message : "Unknown error occurred.";
                            }
                            
                            setError(errorMessage);
                        } finally {
                            setIsProcessing(false);
                            audioChunksRef.current = [];
                            setWarning(null);
                        }
                    };

                    // Request data at intervals to monitor file size (every 10 seconds)
                    mediaRecorder.start(10000);
                })
                .catch((error) => {
                    console.error("❌ Error accessing microphone:", error);
                    setError("Failed to access microphone. Please ensure microphone permissions are granted.");
                    setIsRecording(false);
                });
            } catch (error) {
                console.error("❌ Error initializing audio context:", error);
                setError("Failed to initialize audio recording. Please try again or use a different browser.");
                setIsRecording(false);
            }
        } else if (mediaRecorderRef.current) {
            console.log("🛑 Stopping recording...");
            cleanupRecording();
        }
    }, [isRecording, setTranscription, setIsProcessing]);

    const handleSave = (filename: string) => {
        console.log("💾 Saving filename:", filename);
        setFilename(filename);
        setShowFilenameModal(false);
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={() => {
                    if (!isRecording || window.confirm("Are you sure you want to stop recording?")) {
                        console.log("🎤 Toggling recording:", !isRecording);
                        setIsRecording((prev) => !prev);
                    }
                }}
                className="p-6 border-black/5 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer w-48 h-48 bg-gray-50"
            >
                <div className="p-4 w-fit h-fit rounded-full bg-violet-500/10">
                    {isRecording ? (
                        <StopCircle className="w-10 h-10 text-red-500" />
                    ) : (
                        <Mic className="w-10 h-10 text-violet-500" />
                    )}
                </div>
                <div className="font-semibold mt-4 text-black">
                    {isRecording ? `Recording: ${formatTime(recordingDuration)}` : "Record Lecture"}
                </div>
                {isRecording && (
                    <div className="text-xs mt-2 text-gray-500">
                        Click to stop
                    </div>
                )}
            </Card>
            
            {warning && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md max-w-md text-center flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{warning}</span>
                </div>
            )}
            
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
