"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Mic } from "lucide-react";
import WavEncoder from "wav-encoder";
import FilenameModal from "./ui/filenamemodal";
import { useTranscription } from "../app/transcriptioncontext"; // Import the context hook

const RecordButton: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Access context values
    const { setFilename, setTranscription } = useTranscription();

    useEffect(() => {
        if (isRecording) {
            console.log("🔴 Recording started...");
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
                        console.log("🛑 Recording stopped. Processing audio...");
                        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                        console.log("📁 Audio blob created:", audioBlob.size, "bytes");

                        const audioArrayBuffer = await audioBlob.arrayBuffer();
                        console.log("🔄 Converting blob to array buffer...");

                        const audioBuffer = await audioContextRef.current?.decodeAudioData(audioArrayBuffer);
                        if (audioBuffer) {
                            console.log("✅ Audio successfully decoded. Encoding to WAV...");

                            const wavData = await WavEncoder.encode({
                                sampleRate: audioBuffer.sampleRate,
                                channelData: [audioBuffer.getChannelData(0)],
                            });

                            const wavBlob = new Blob([wavData], { type: "audio/wav" });
                            console.log("📀 WAV file created:", wavBlob.size, "bytes");

                            // Send the WAV blob to the deployed Express server
                            const formData = new FormData();
                            formData.append("audio", new File([wavBlob], "recording.wav", { type: "audio/wav" }));

                            console.log("📡 Sending audio file to backend...");

                            try {
                                const response = await fetch("https://memo-app-backend-jq7x1nxgi-lwazi-shabalalas-projects.vercel.app/upload", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (!response.ok) {
                                    throw new Error(`Server responded with status: ${response.status}`);
                                }

                                const result = await response.json();
                                console.log("✅ Transcription received:", result.transcription);
                                setTranscription(result.transcription); // Save transcription to context
                                setShowFilenameModal(true);
                            } catch (error) {
                                console.error("❌ Fetch error:", error);
                            }
                        }
                        audioChunksRef.current = [];
                    };

                    mediaRecorder.start();
                })
                .catch((error) => {
                    console.error("❌ Error accessing microphone:", error);
                    setIsRecording(false);
                });
        } else if (mediaRecorderRef.current) {
            console.log("🛑 Stopping recording...");
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
    }, [isRecording, setTranscription]);

    const handleSave = (filename: string) => {
        console.log("💾 Saving filename:", filename);
        setFilename(filename); // Save filename to context
        setShowFilenameModal(false);
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={() => {
                    console.log("🎤 Toggling recording:", !isRecording);
                    setIsRecording((prev) => !prev);
                }}
                className="p-6 border-black/5 flex flex-col items-center justify-center hover:shadow-md transition cursor-pointer w-40 h-40"
            >
                <div className="p-4 w-fit h-fit rounded-full bg-violet-500/10">
                    <Mic className="w-10 h-10 text-violet-500" />
                </div>
                <div className="font-semibold mt-4 text-black">
                    {isRecording ? "Recording..." : "Record"}
                </div>
            </Card>
            <FilenameModal
                open={showFilenameModal}
                onClose={() => setShowFilenameModal(false)}
                onSave={handleSave}
            />
        </div>
    );
};

export default RecordButton;
