import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import saveQuizz from "./saveToDb";

interface Answer {
    answerText: string;
    isCorrect: boolean;
}

interface Question {
    questionText: string;
    answers: Answer[];
}

interface Quiz {
    name: string;
    description: string;
    questions: Question[];
}

interface QuizResult {
    quizz: Quiz;
}

function validateQuizResult(result: unknown): result is QuizResult {
    try {
        if (!result || typeof result !== 'object') {
            console.error('Quiz result is not an object');
            return false;
        }
        
        const quiz = (result as QuizResult).quizz;
        if (!quiz || typeof quiz !== 'object') {
            console.error('Quiz.quizz is not an object');
            return false;
        }
        
        if (typeof quiz.name !== 'string') {
            console.error('Quiz.quizz.name is not a string');
            return false;
        }
        if (typeof quiz.description !== 'string') {
            console.error('Quiz.quizz.description is not a string');
            return false;
        }
        if (!Array.isArray(quiz.questions)) {
            console.error('Quiz.quizz.questions is not an array');
            return false;
        }
        
        // Ensure we have at least one question
        if (quiz.questions.length === 0) {
            console.error('Quiz has no questions');
            return false;
        }
        
        for (const question of quiz.questions) {
            if (typeof question.questionText !== 'string') {
                console.error('Question.questionText is not a string');
                return false;
            }
            if (!Array.isArray(question.answers)) {
                console.error('Question.answers is not an array');
                return false;
            }
            if (question.answers.length !== 4) {
                console.error(`Question "${question.questionText.substring(0, 30)}..." has ${question.answers.length} answers, expected 4`);
                return false;
            }
            
            let correctAnswerCount = 0;
            for (const answer of question.answers) {
                if (typeof answer.answerText !== 'string') {
                    console.error('Answer.answerText is not a string');
                    return false;
                }
                if (typeof answer.isCorrect !== 'boolean') {
                    console.error('Answer.isCorrect is not a boolean');
                    return false;
                }
                if (answer.isCorrect) correctAnswerCount++;
            }
            
            // Ensure exactly one correct answer
            if (correctAnswerCount !== 1) {
                console.error(`Question "${question.questionText.substring(0, 30)}..." has ${correctAnswerCount} correct answers, expected 1`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
}

// Fallback function to create a basic quiz if OpenAI fails
function createFallbackQuiz(content: string): Quiz {
    const title = "Quiz on Provided Content";
    const description = "Quiz generated from the provided lecture transcription.";
    
    // Create a simple question from the content
    const sampleQuestion = {
        questionText: "What was the main topic of this lecture?",
        answers: [
            { answerText: "The information provided in the transcription", isCorrect: true },
            { answerText: "An unrelated topic", isCorrect: false },
            { answerText: "Only technical details", isCorrect: false },
            { answerText: "None of the above", isCorrect: false }
        ]
    };
    
    return {
        name: title,
        description: description,
        questions: [sampleQuestion]
    };
}

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");

        let body: { text?: string };
        try {
            body = await req.json();
        } catch (e) {
            console.error("❌ Error parsing request body:", e);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        const { text } = body;
        if (!text) {
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k",
            temperature: 0.5, // Reduced temperature for more consistent outputs
            maxRetries: 3,
            timeout: 120000, // 2 minutes timeout
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts quiz questions from the provided text",
            parameters: {
                type: "object",
                properties: {
                    quizz: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        questionText: { type: "string" },
                                        answers: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    answerText: { type: "string" },
                                                    isCorrect: { type: "boolean" },
                                                },
                                                required: ["answerText", "isCorrect"]
                                            },
                                            minItems: 4,
                                            maxItems: 4
                                        }
                                    },
                                    required: ["questionText", "answers"]
                                },
                                minItems: 1
                            }
                        },
                        required: ["name", "description", "questions"]
                    }
                },
                required: ["quizz"]
            }
        };

        const runnable = model
            .bind({
                functions: [extractionFunctionSchema],
                function_call: { name: "extractor" },
            })
            .pipe(parser);

        const prompt = `
            Create a quiz based on the following text. Follow these rules strictly:

            1. Generate 3-5 comprehensive questions that cover the main topics
            2. Each question must:
               - Be clear and specific
               - Have exactly 4 answer choices
               - Have EXACTLY ONE correct answer marked with isCorrect: true
               - Have ALL OTHER answers marked with isCorrect: false
            3. Ensure proper JSON structure with all required fields
            4. Make sure the quiz is focused on testing comprehension of the main concepts

            Example question format:
            {
              "questionText": "What is the main focus of this lecture?",
              "answers": [
                {"answerText": "The correct answer", "isCorrect": true},
                {"answerText": "An incorrect answer", "isCorrect": false},
                {"answerText": "Another incorrect answer", "isCorrect": false},
                {"answerText": "Yet another incorrect answer", "isCorrect": false}
              ]
            }

            Important: Your response must be valid JSON matching this exact structure:
            {
              "quizz": {
                "name": "string",
                "description": "string",
                "questions": [
                  {
                    "questionText": "string",
                    "answers": [
                      {"answerText": "string", "isCorrect": boolean},
                      {"answerText": "string", "isCorrect": boolean},
                      {"answerText": "string", "isCorrect": boolean},
                      {"answerText": "string", "isCorrect": boolean}
                    ]
                  }
                ]
              }
            }
        `;

        console.log("🧠 Sending request to OpenAI...");
        let result: unknown;
        let quizData: Quiz;
        let usedFallback = false;
        
        try {
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${text}` }],
            });
            
            result = await runnable.invoke([message]);
            console.log("📝 Raw response:", JSON.stringify(result, null, 2));
            
            if (!validateQuizResult(result)) {
                console.log("❌ OpenAI response failed validation, trying fallback");
                quizData = createFallbackQuiz(text);
                usedFallback = true;
            } else {
                quizData = (result as QuizResult).quizz;
            }
        } catch (error) {
            console.error("❌ OpenAI API error:", error);
            console.log("Using fallback quiz generation");
            quizData = createFallbackQuiz(text);
            usedFallback = true;
        }

        try {
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz(quizData);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: quizData.questions.length,
                usedFallback,
                success: true
            }, { status: 200 });
        } catch (error) {
            console.error("❌ Database error:", error);
            return NextResponse.json(
                { error: "Failed to save quiz", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
