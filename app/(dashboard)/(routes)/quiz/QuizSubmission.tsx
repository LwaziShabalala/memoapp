import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

type Props = {
    scorePercentage: number,
    score: number,
    totalQuestions: number
}

const QuizSubmission = ({ scorePercentage, score, totalQuestions }: Props) => {
    const getScoreColor = () => {
        if (scorePercentage >= 80) return "text-green-400";
        if (scorePercentage >= 60) return "text-yellow-400";
        return "text-red-400";
    }

    const getScoreMessage = () => {
        if (scorePercentage === 100) return "Perfect Score!";
        if (scorePercentage >= 80) return "Excellent Work!";
        if (scorePercentage >= 60) return "Good Job!";
        return "Keep Practicing!";
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="rounded-full bg-gray-800 p-4">
                            <Trophy className="w-12 h-12 text-yellow-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-200">
                                Quiz Complete!
                            </h2>
                            <p className="text-gray-400">
                                Here&apos;s how you performed
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className={`text-4xl font-bold ${getScoreColor()}`}>
                                {scorePercentage}%
                            </p>
                            <p className="text-gray-300">
                                {score} out of {totalQuestions} questions correct
                            </p>
                        </div>

                        <p className="text-lg font-medium text-gray-200">
                            {getScoreMessage()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default QuizSubmission;