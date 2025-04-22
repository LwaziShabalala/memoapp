"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Heading } from "../../../../../components/heading";

interface Lecture {
    id: string;
    name: string;
    transcription: string;
}

interface LectureDetailProps {
    params: { id: string };
}

const LectureDetail: React.FC<LectureDetailProps> = ({ params }) => {
    const { id } = params;
    const router = useRouter();
    const [lecture, setLecture] = useState<Lecture | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generationAttempts, setGenerationAttempts] = useState(0);

    useEffect(() => {
        try {
            const lectures: Lecture[] = JSON.parse(localStorage.getItem("lectures") || "[]");
            const foundLecture = lectures.find(lecture => lecture.id === id);
            if (foundLecture) {
                setLecture(foundLecture);
            } else {
                throw new Error("Lecture not found");
            }
        } catch (error) {
            console.error("Error loading lecture:", error);
            setError("Failed to load lecture details");
        }
    }, [id]);

    const handleQuizGeneration = async () => {
        if (!lecture?.transcription) {
            setError("No transcription available to generate quiz");
            return;
        }

        if (lecture.transcription.length < 50) {
            setError("Transcription is too short to generate a meaningful quiz");
            return;
        }

        setLoading(true);
        setError(null);
        setGenerationAttempts(prev => prev + 1);
        
        try {
            // Truncate long transcriptions to prevent timeouts
            const maxLength = 10000;
            const truncatedTranscription = lecture.transcription.length > maxLength 
                ? lecture.transcription.substring(0, maxLength) 
                : lecture.transcription;
            
            const response = await fetch("/api/quiz/generate-quiz", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    text: truncatedTranscription 
                }),
            });

            // First check if we can parse the response as JSON
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                // Handle non-JSON responses
                const textResponse = await response.text();
                throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || data.details || "Failed to generate quiz");
            }

            const { quizzId, success } = data;
            if (!quizzId || !success) {
                throw new Error("No quiz ID returned from server or generation was not successful");
            }

            router.push(`/quiz/${quizzId}`);
        } catch (error) {
            console.error("Error in quiz generation:", error);
            setError(error instanceof Error 
                ? `Quiz generation failed: ${error.message}` 
                : "An unexpected error occurred during quiz generation");
        } finally {
            setLoading(false);
        }
    };

    if (!lecture) {
        return (
            <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    <p className="text-gray-400 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 overflow-y-auto bg-gray-950">
            <div className="min-h-screen p-4">
                <div className="max-w-3xl mx-auto">
                    <Button
                        variant="ghost"
                        className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Card className="bg-gray-900 border-gray-800 shadow-lg">
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <Heading
                                    title={lecture.name}
                                    description="Detailed view of your lecture transcription and options for quiz generation."
                                    icon={File}
                                />
                                {error && (
                                    <div className="bg-red-900/20 border border-red-900 text-red-300 px-4 py-2 rounded-md">
                                        {error}
                                        {generationAttempts > 1 && (
                                            <div className="mt-2 text-sm">
                                                Note: If quiz generation fails repeatedly, try with a shorter transcription or wait a few minutes before trying again.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={handleQuizGeneration}
                                disabled={loading || !lecture.transcription}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating Quiz...
                                    </div>
                                ) : (
                                    "Generate Quiz"
                                )}
                            </Button>
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-gray-200">Transcription</h2>
                                <div className="bg-gray-800 rounded-lg p-6 max-h-[400px] overflow-y-auto border border-gray-700 shadow-inner">
                                    <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
                                        {lecture.transcription}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LectureDetail;
