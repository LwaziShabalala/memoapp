"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Mic } from "lucide-react";
import WavEncoder from "wav-encoder";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "@/app/transcriptioncontext";
import { useLoading } from "../app/(dashboard)/loadingcontext";

const RecordButton: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    const { setFilename, setTranscription } = useTranscription();
    const { setIsProcessing } = useLoading();

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
                            console.log("🔊 Audio chunk recorded:", event.data.size, "bytes");
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        try {
                            console.log("🛑 Recording stopped. Processing audio...");
                            setIsProcessing(true);
                            
                            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                            console.log("📁 Audio blob created:", audioBlob.size, "bytes");

                            const audioArrayBuffer = await audioBlob.arrayBuffer();
                            console.log("🔄 Converting blob to array buffer...");

                            const audioBuffer = await audioContextRef.current?.decodeAudioData(audioArrayBuffer);
                            if (!audioBuffer) {
                                throw new Error("Failed to decode audio data");
                            }

                            console.log("✅ Audio successfully decoded. Encoding to WAV...");

                            const wavData = await WavEncoder.encode({
                                sampleRate: audioBuffer.sampleRate,
                                channelData: [audioBuffer.getChannelData(0)],
                            });

                            const wavBlob = new Blob([wavData], { type: "audio/wav" });
                            console.log("📀 WAV file created:", wavBlob.size, "bytes");

                            const formData = new FormData();
                            formData.append("file", new File([wavBlob], "recording.wav", { type: "audio/wav" }));
                            
                            console.log("📡 Sending audio file to API route...");

                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 30000);

                            // Use the Next.js API route instead of direct OpenAI call
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
            console.log("🛑 Stopping recording...");
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
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
                    console.log("🎤 Toggling recording:", !isRecording);
                    setIsRecording((prev) => !prev);
                }}
                className="p-6 border-black/5 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer w-40 h-40 bg-gray-50"
            >
                <div className="p-4 w-fit h-fit rounded-full bg-violet-500/10">
                    <Mic className="w-10 h-10 text-violet-500" />
                </div>
                <div className="font-semibold mt-4 text-black">
                    {isRecording ? "Recording..." : "Record"}
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
