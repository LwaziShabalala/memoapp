"use client";
import { Card } from "@/components/ui/card";
import { File, Trash2 } from "lucide-react";
import { Heading } from "../../../../components/heading";
import { useTranscription } from "../../../transcriptioncontext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Lecture {
    id: string;
    name: string;
    transcription: string;
}

const Mylectures: React.FC = () => {
    const { filename, transcription, clearTranscription, saveLecture } = useTranscription();
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const router = useRouter();

    useEffect(() => {
        const storedLectures = JSON.parse(localStorage.getItem("lectures") || "[]");
        setLectures(storedLectures);
    }, []);

    useEffect(() => {
        if (filename && transcription) {
            saveLecture();
            const updatedLectures = JSON.parse(localStorage.getItem("lectures") || "[]");
            setLectures(updatedLectures);
            clearTranscription();
        }
    }, [filename, transcription, saveLecture, clearTranscription]);

    const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedLectures = lectures.filter(lecture => lecture.id !== id);
        setLectures(updatedLectures);
        localStorage.setItem("lectures", JSON.stringify(updatedLectures));
    }, [lectures]);

    const handleCardClick = useCallback((lecture: Lecture) => {
        router.push(`/lecturedetail/${lecture.id}`);
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-950">
            <Heading
                title="My Lectures"
                description="Your saved lectures will appear here"
                icon={File}
                iconColor="text-violet-500"
                bgColor="bg-violet-500/10"
            />
            <div className="bg-gray-950 px-4 lg:px-8">
                {lectures.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                        {lectures.map((lecture) => (
                            <Card
                                className="p-4 relative cursor-pointer bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-colors"
                                key={lecture.id}
                                onClick={() => handleCardClick(lecture)}
                            >
                                <h2 className="font-semibold mb-2 text-gray-200">{lecture.name}</h2>
                                <button
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                                    onClick={(e) => handleDelete(lecture.id, e)}
                                    aria-label="Delete lecture"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 mt-4">No lectures yet. Start recording!</p>
                )}
            </div>
        </div>
    );
};

export default Mylectures;