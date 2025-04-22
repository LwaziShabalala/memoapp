"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ui/ProgressBar";
import { ChevronLeft, X } from "lucide-react";
import ResultCard from "./ResultCard";
import QuizzSubmission from "./QuizSubmission";

// Define the Answer type
type Answer = {
  id: number;
  answerText: string;
  isCorrect: boolean;
};

const questions = [
  {
    questionText: "What is React?",
    answers: [
      { answerText: "A library for building user interfaces", isCorrect: true, id: 1 },
      { answerText: "A front-end framework", isCorrect: false, id: 2 },
      { answerText: "A back-end framework", isCorrect: false, id: 3 },
      { answerText: "A database", isCorrect: false, id: 4 },
    ]
  },
  {
    questionText: "What is JSX?",
    answers: [
      { answerText: "JavaScript XML", isCorrect: true, id: 1 },
      { answerText: "JavaScript", isCorrect: false, id: 2 },
      { answerText: "JavaScript and XML", isCorrect: false, id: 3 },
      { answerText: "JavaScript and HTML", isCorrect: false, id: 4 },
    ]
  },
];

export default function Quiz() {
  const [started, setStarted] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

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
      <QuizzSubmission
        score={score}
        scorePercentage={scorePercentage}
        totalQuestions={questions.length}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full bg-gray-800 shadow-md">
        <header className="grid grid-cols-[auto,1fr,auto] items-center py-2 px-4 gap-2">
          <Button size="icon" variant="outline"><ChevronLeft /></Button>
          <div className="text-center">
            <span className="text-sm font-medium">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          <Button size="icon" variant="outline"><X /></Button>
        </header>
        <div className="px-4 pb-2">
          <ProgressBar value={(currentQuestion / questions.length) * 100} />
        </div>
      </div>

      {/* Main content - Allow vertical scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <main className="p-4">
          {!started ? (
            <div className="flex justify-center items-center h-full">
              <h1 className="text-2xl font-bold text-center">Welcome to the quiz page</h1>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-6 break-words hyphens-auto">{questions[currentQuestion].questionText}</h2>
              <div className="flex flex-col gap-4">
                {questions[currentQuestion].answers.map(answer => (
                  <div
                    key={answer.id}
                    className={`border rounded-md ${
                      selectedAnswer === answer.id ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700'
                    }`}
                  >
                    <div
                      onClick={() => selectedAnswer === null ? handleAnswer(answer) : null}
                      className={`px-4 py-3 cursor-pointer ${selectedAnswer !== null ? 'cursor-default' : ''}`}
                    >
                      <p className="text-left break-all hyphens-auto">
                        {answer.answerText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="w-full py-4 px-4 bg-gray-800 border-t border-gray-700">
        <div className="mb-4">
          <ResultCard
            isCorrect={isCorrect}
            correctAnswer={
              questions[currentQuestion].answers.find(answer => answer.isCorrect)?.answerText || "No correct answer"
            }
          />
        </div>
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700" 
          onClick={handleNext}
          disabled={started && selectedAnswer === null}
        >
          {!started ? 'Start' : (currentQuestion === questions.length - 1) ? 'Submit' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
