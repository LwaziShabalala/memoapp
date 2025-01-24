"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ui/ProgressBar";
import ResultCard from "./ResultCard";
import QuizSubmission from "./QuizSubmission";
import { questionAnswers, questions as DbQuestions, quizzez } from "@/app/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Answer = InferSelectModel<typeof questionAnswers>;
type Question = InferSelectModel<typeof DbQuestions> & { answers: Answer[] };
type Quizz = InferSelectModel<typeof quizzez> & { questions: Question[] };

type Props = {
    quizz: Quizz;
};

export default function QuizQuestions(props: Props) {
    const { questions } = props.quizz;
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleNext = () => {
        if (!started) {
            setStarted(true);
            return;
        }
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setSubmitted(true);
            return;
        }
        setSelectedAnswer(null);
        setIsCorrect(null);
    };

    const handleAnswer = (answer: Answer) => {
        setSelectedAnswer(answer.id);
        const isCurrentCorrect = answer.isCorrect;
        if (isCurrentCorrect) {
            setScore(score + 1);
        }
        setIsCorrect(isCurrentCorrect);
    };

    const scorePercentage: number = Math.round((score / questions.length) * 100);

    if (submitted) {
        return (
            <QuizSubmission
                score={score}
                scorePercentage={scorePercentage}
                totalQuestions={questions.length}
            />
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
            <div className="sticky top-0 z-10 bg-slate-800 shadow-lg py-4 px-4">
                <div className="sticky top-0 z-10 bg-slate-800 shadow-lg py-4 px-4">
                    <header className="grid grid-cols-[1fr] items-center max-w-4xl mx-auto">
                        <ProgressBar value={(currentQuestion / questions.length) * 100} />
                    </header>
                </div>

            </div>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl mx-auto">
                    {!started ? (
                        <div className="text-center space-y-6">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                                Welcome to the Quiz
                            </h1>
                            <p className="text-slate-300">
                                Test your knowledge with {questions.length} questions
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400">
                                    Question {currentQuestion + 1} of {questions.length}
                                </p>
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
                                    {questions[currentQuestion].questionText}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {questions[currentQuestion].answers.map((answer) => (
                                    <Button
                                        key={answer.id}
                                        onClick={() => handleAnswer(answer)}
                                        variant={selectedAnswer === answer.id ? "secondary" : "outline"}
                                        className={`p-4 h-auto text-left justify-start transition-transform 
                                            duration-300 hover:scale-105 
                                            ${selectedAnswer === answer.id
                                                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                                                : "bg-slate-800 text-slate-300"
                                            }`}
                                        disabled={selectedAnswer !== null}
                                    >
                                        {answer.answerText}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="sticky bottom-0 bg-slate-800 p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    <ResultCard
                        isCorrect={isCorrect}
                        correctAnswer={
                            questions[currentQuestion].answers.find((answer) => answer.isCorrect === true)?.answerText ||
                            ""
                        }
                    />
                    <Button
                        onClick={handleNext}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 transition-transform duration-300"
                        disabled={started && selectedAnswer === null}
                    >
                        {!started
                            ? "Start Quiz"
                            : currentQuestion === questions.length - 1
                                ? "Submit"
                                : "Next Question"}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
