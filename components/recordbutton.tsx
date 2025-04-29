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
    const [currentSegment, setCurrentSegment] = useState(1);
    const [segmentDuration, setSegmentDuration] = useState(0);
    const [isProcessingSegment, setIsProcessingSegment] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const allTranscriptionsRef = useRef<string[]>([]);
    
    // Settings for chunking and recording
    const SEGMENT_DURATION = 60; // Record in 60-second segments to avoid payload size issues
    const MAX_SEGMENTS = 180; // Allow up to 180 segments (3 hours total)
    
    // Audio settings optimized for lectures & smaller file size
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
    
    // Process a segment of audio
    const processAudioSegment = async (audioChunks: Blob[]): Promise<string> => {
        try {
            if (audioChunks.length === 0) {
                throw new Error("No audio data recorded in this segment");
            }
            
            const audioBlob = new Blob(audioChunks, { 
                type: mediaRecorderRef.current?.mimeType || 'audio/webm'
            });
            console.log(`📁 Segment ${currentSegment} audio blob: ${audioBlob.size} bytes`);

            // Check if blob size is too small (likely empty or corrupted audio)
            if (audioBlob.size < 1000) { // Less than 1KB is suspicious
                console.warn(`⚠️ Segment ${currentSegment} has suspiciously small size: ${audioBlob.size} bytes`);
                if (audioBlob.size === 0) {
                    throw new Error("Empty audio segment detected");
                }
            }

            const audioArrayBuffer = await audioBlob.arrayBuffer();
            
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || 
                    ((window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext);
                
                if (!AudioContextClass) {
                    throw new Error("AudioContext not supported in this browser");
                }
                
                audioContextRef.current = new AudioContextClass();
            }

            // Decode the audio - this can fail if the audio data is corrupted
            let audioBuffer;
            try {
                audioBuffer = await audioContextRef.current.decodeAudioData(audioArrayBuffer);
            } catch (decodeError) {
                console.error(`❌ Failed to decode audio segment ${currentSegment}:`, decodeError);
                throw new Error("Failed to decode audio. The recording may be corrupted.");
            }
            
            // Check if audio buffer contains actual audio data
            if (audioBuffer.duration < 0.5) { // Less than 0.5 seconds is suspicious
                console.warn(`⚠️ Segment ${currentSegment} has very short duration: ${audioBuffer.duration} seconds`);
            }
            
            // Converting to WAV with lower quality settings
            const wavData = await WavEncoder.encode({
                sampleRate: AUDIO_SAMPLE_RATE,
                channelData: Array.from({ length: AUDIO_CHANNELS }, (_, i) => 
                    i < audioBuffer.numberOfChannels ? audioBuffer.getChannelData(i) : new Float32Array(audioBuffer.length)
                ),
            });

            const wavBlob = new Blob([wavData], { type: "audio/wav" });
            console.log(`📀 Segment ${currentSegment} WAV file: ${wavBlob.size} bytes`);

            const formData = new FormData();
            formData.append("file", new File([wavBlob], `segment_${currentSegment}.wav`, { type: "audio/wav" }));
            
            console.log(`📡 Sending segment ${currentSegment} to API...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout (server has 60s)

            try {
                const response = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { raw: errorText };
                    }
                    
                    console.error(`❌ API error (${response.status}):`, errorData);
                    throw new Error(`Server error (${response.status}): ${errorData.error || errorText}`);
                }

                const result = await response.json();
                console.log(`✅ Segment ${currentSegment} transcription received`);
                return result.transcription || "";
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
                    throw new Error("Transcription request timed out. The audio segment may be too large.");
                }
                throw fetchError;
            }
            
        } catch (error) {
            console.error(`❌ Error processing segment ${currentSegment}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Segment ${currentSegment} failed: ${errorMessage}`);
        }
    };

    const startRecording = async () => {
        console.log("🔴 Recording started...");
        setError(null);
        setWarning(null);
        setRecordingDuration(0);
        setSegmentDuration(0);
        setCurrentSegment(1);
        audioChunksRef.current = [];
        allTranscriptionsRef.current = [];
        
        try {
            const AudioContextClass = window.AudioContext || 
                ((window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext);
            
            if (!AudioContextClass) {
                throw new Error("AudioContext not supported in this browser");
            }
            
            audioContextRef.current = new AudioContextClass({
                sampleRate: AUDIO_SAMPLE_RATE
            });

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            console.log("🎤 Microphone access granted");
            streamRef.current = stream;
            
            const mediaRecorder = new MediaRecorder(stream, {
                audioBitsPerSecond: AUDIO_SAMPLE_RATE * AUDIO_BIT_DEPTH * AUDIO_CHANNELS,
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                    ? 'audio/webm;codecs=opus'   // Opus codec has better compression for speech
                    : 'audio/webm'
            });
            
            mediaRecorderRef.current = mediaRecorder;

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    return newDuration;
                });
                
                setSegmentDuration(prev => {
                    const newSegmentDuration = prev + 1;
                    
                    // Auto-process segment when it reaches the limit
                    if (newSegmentDuration >= SEGMENT_DURATION && !isProcessingSegment) {
                        console.log(`⏱️ Segment ${currentSegment} complete (${SEGMENT_DURATION}s)`);
                        handleSegmentComplete();
                    }
                    
                    return newSegmentDuration;
                });
            }, 1000);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Request data at intervals (every 2 seconds)
            mediaRecorder.start(2000);
            setIsRecording(true);
            
        } catch (error) {
            console.error("❌ Error starting recording:", error);
            setError("Failed to start recording. Please ensure microphone permissions are granted.");
            setIsRecording(false);
        }
    };
    
    const handleSegmentComplete = async () => {
        if (mediaRecorderRef.current && audioChunksRef.current.length > 0) {
            setIsProcessingSegment(true);
            console.log(`🔄 Processing segment ${currentSegment}...`);
            
            // Pause recording during processing
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.pause();
            }
            
            const currentChunks = [...audioChunksRef.current];
            audioChunksRef.current = []; // Reset for next segment
            
            try {
                const transcription = await processAudioSegment(currentChunks);
                allTranscriptionsRef.current.push(transcription);
                
                // Continue to next segment if still recording
                if (isRecording && currentSegment < MAX_SEGMENTS) {
                    setCurrentSegment(prev => prev + 1);
                    setSegmentDuration(0);
                    
                    // Resume recording if it was paused
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
                        mediaRecorderRef.current.resume();
                    }
                } else {
                    // Stop recording if max segments reached
                    if (currentSegment >= MAX_SEGMENTS) {
                        setWarning("Maximum recording duration reached");
                        setIsRecording(false);
                    }
                }
            } catch (error) {
                console.error(`❌ Error in segment ${currentSegment}:`, error);
                setWarning(`Warning: Segment ${currentSegment} failed to process. Recording will continue.`);
                
                // Resume recording despite error
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused' && isRecording) {
                    mediaRecorderRef.current.resume();
                }
            } finally {
                setIsProcessingSegment(false);
            }
        }
    };

    const stopRecording = async () => {
        setIsProcessing(true);
        console.log("🛑 Stopping recording and processing final segment...");
        
        try {
            // First stop the MediaRecorder to ensure we get the final data
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                // Request the final chunk of data
                mediaRecorderRef.current.requestData();
                
                // Wait a bit to ensure the ondataavailable event fires
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Now stop the recorder
                mediaRecorderRef.current.stop();
            }
            
            // Wait a bit more to ensure all data is processed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Process final segment if there's any data
            if (audioChunksRef.current.length > 0) {
                try {
                    const finalTranscription = await processAudioSegment(audioChunksRef.current);
                    allTranscriptionsRef.current.push(finalTranscription);
                } catch (finalSegmentError) {
                    console.error("❌ Error processing final segment:", finalSegmentError);
                    setWarning(`Warning: Final segment failed to process. Previous segments will be saved.`);
                }
            } else {
                console.log("ℹ️ No audio data in final segment");
            }
            
            // Combine all transcriptions
            const fullTranscription = allTranscriptionsRef.current.join(" ");
            console.log("✅ Full transcription complete");
            setTranscription(fullTranscription);
            
            // Show filename dialog
            setShowFilenameModal(true);
        } catch (error) {
            console.error("❌ Error finalizing recording:", error);
            let errorMessage = "Failed to process recording. ";
            
            if (error instanceof Error) {
                errorMessage += error.message;
            }
            
            setError(errorMessage);
        } finally {
            // Clean up
            cleanupRecording();
            setIsProcessing(false);
            audioChunksRef.current = [];
            setIsRecording(false);
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
            startRecording();
        } else if (mediaRecorderRef.current) {
            stopRecording();
        }
    }, [isRecording]);

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
                        {isProcessingSegment 
                            ? `Processing segment ${currentSegment}...` 
                            : `Segment ${currentSegment}: ${formatTime(segmentDuration)}`}
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
