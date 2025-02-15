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
        
        try {
            const response = await fetch("/api/quiz/generate-quiz", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ 
                    text: lecture.transcription 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || "Failed to generate quiz");
            }

            const { quizzId } = data;
            if (!quizzId) {
                throw new Error("No quiz ID returned from server");
            }

            router.push(`/quiz/${quizzId}`);
        } catch (error) {
            console.error("Error in quiz generation:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!lecture) {
        return (
            <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    <p className="text-gray-400 mt-2">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-gray-950 p-4">
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
    );
};

export default LectureDetail;
