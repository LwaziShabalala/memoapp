import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

type ResultCardProps = {
    isCorrect: boolean | null;
    correctAnswer: string;
};

const ResultCard = ({ isCorrect, correctAnswer }: ResultCardProps) => {
    if (isCorrect === null) return null;

    return (
        <div
            className={`p-4 rounded-lg shadow-lg flex items-center gap-3 mb-4 transition-all duration-200 ${isCorrect
                ? 'bg-green-500/20 text-green-100 border border-green-500/30'
                : 'bg-red-500/20 text-red-100 border border-red-500/30'
                }`}
        >
            {isCorrect ? (
                <CheckCircle className={`h-6 w-6 ${isCorrect ? 'text-green-400' : 'text-red-400'}`} />
            ) : (
                <AlertCircle className={`h-6 w-6 ${isCorrect ? 'text-green-400' : 'text-red-400'}`} />
            )}
            <div className="flex-1">
                {isCorrect ? (
                    <p className="font-medium">Correct! Well done!</p>
                ) : (
                    <div className="space-y-1">
                        <p className="font-medium">Incorrect</p>
                        <p className="text-sm opacity-90">
                            The correct answer was: {correctAnswer}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultCard;