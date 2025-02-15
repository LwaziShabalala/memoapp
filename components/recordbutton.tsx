import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Mic, Loader2 } from "lucide-react";
import WavEncoder from "wav-encoder";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "../app/transcriptioncontext";

interface RecordButtonProps {
  onProcessingChange: (isProcessing: boolean) => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ onProcessingChange }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    const { setFilename, setTranscription } = useTranscription();

    // Update parent component when processing state changes
    useEffect(() => {
        onProcessingChange(isProcessing);
    }, [isProcessing, onProcessingChange]);

    useEffect(() => {
        if (isRecording) {
            console.log("🔴 Recording started...");
            setError(null);
            audioContextRef.current = new (window.AudioContext || window.AudioContext)();

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    console.log("🎤 Microphone access granted.");
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        try {
                            setIsProcessing(true);
                            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                            const audioArrayBuffer = await audioBlob.arrayBuffer();
                            const audioBuffer = await audioContextRef.current?.decodeAudioData(audioArrayBuffer);
                            
                            if (!audioBuffer) {
                                throw new Error("Failed to decode audio data");
                            }

                            const wavData = await WavEncoder.encode({
                                sampleRate: audioBuffer.sampleRate,
                                channelData: [audioBuffer.getChannelData(0)],
                            });

                            const wavBlob = new Blob([wavData], { type: "audio/wav" });
                            const formData = new FormData();
                            formData.append("audio", new File([wavBlob], "recording.wav", { type: "audio/wav" }));

                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 30000);

                            const response = await fetch("https://8001-01jd6w67mbzjnztarkx6j3a1he.cloudspaces.litng.ai/predict", {
                                method: "POST",
                                body: formData,
                                headers: { 'Accept': 'application/json' }
                            });

                            clearTimeout(timeoutId);

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Server error (${response.status}): ${errorText}`);
                            }

                            const result = await response.json();
                            setTranscription(result.transcription);
                            setShowFilenameModal(true);
                        } catch (error) {
                            let errorMessage = "Failed to process recording. ";
                            
                            if (error instanceof TypeError && error.message.includes("fetch")) {
                                errorMessage += "Could not connect to the server. Please check your internet connection and try again.";
                            } else if (error instanceof DOMException && error.name === "AbortError") {
                                errorMessage += "Request timed out. Please try again.";
                            } else {
                                errorMessage += error instanceof Error ? error.message : "Unknown error occurred.";
                            }
                            
                            setError(errorMessage);
                        } finally {
                            setIsProcessing(false);
                            audioChunksRef.current = [];
                        }
                    };

                    mediaRecorder.start();
                })
                .catch((error) => {
                    console.error("❌ Error accessing microphone:", error);
                    setError("Failed to access microphone. Please ensure microphone permissions are granted.");
                    setIsRecording(false);
                });
        } else if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
    }, [isRecording, setTranscription]);

    const handleSave = (filename: string) => {
        setFilename(filename);
        setShowFilenameModal(false);
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={() => {
                    if (!isProcessing) {
                        setIsRecording((prev) => !prev);
                    }
                }}
                className={`p-6 border-black/5 flex flex-col items-center justify-center transition w-40 h-40 ${
                    isProcessing ? 'cursor-not-allowed opacity-80' : 'hover:shadow-md cursor-pointer'
                }`}
            >
                <div className="p-4 w-fit h-fit rounded-full bg-violet-500/10">
                    {isProcessing ? (
                        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    ) : (
                        <Mic className="w-10 h-10 text-violet-500" />
                    )}
                </div>
                <div className="font-semibold mt-4 text-black">
                    {isProcessing ? "Processing..." : isRecording ? "Recording..." : "Record"}
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
