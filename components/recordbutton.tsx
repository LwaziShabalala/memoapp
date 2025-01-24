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
            audioContextRef.current = new (window.AudioContext || window.AudioContext)();
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };

                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                        const audioArrayBuffer = await audioBlob.arrayBuffer();
                        const audioBuffer = await audioContextRef.current?.decodeAudioData(audioArrayBuffer);

                        if (audioBuffer) {
                            const wavData = await WavEncoder.encode({
                                sampleRate: audioBuffer.sampleRate,
                                channelData: [audioBuffer.getChannelData(0)],
                            });

                            const wavBlob = new Blob([wavData], { type: "audio/wav" });

                            // Send the WAV blob to the server for transcription
                            const formData = new FormData();
                            formData.append("audio", new File([wavBlob], "recording.wav", { type: "audio/wav" }));

                            const response = await fetch("http://localhost:3001/upload", {
                                method: "POST",
                                body: formData,
                            });

                            const result = await response.json();
                            console.log("Transcription result:", result.transcription); // Log transcription
                            setTranscription(result.transcription); // Save transcription to context
                            setShowFilenameModal(true);
                        }
                        audioChunksRef.current = [];
                    };

                    mediaRecorder.start();
                })
                .catch(() => setIsRecording(false));
        } else if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
    }, [isRecording, setTranscription]);

    const handleSave = (filename: string) => {
        console.log("Saving filename:", filename); // Log filename
        setFilename(filename); // Save filename to context
        setShowFilenameModal(false);
    };

    return (
        <div className="flex flex-col items-center">
            <Card
                onClick={() => setIsRecording((prev) => !prev)}
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
