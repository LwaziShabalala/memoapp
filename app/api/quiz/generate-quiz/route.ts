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
        if (!result || typeof result !== 'object') return false;
        
        const quiz = (result as QuizResult).quizz;
        if (!quiz || typeof quiz !== 'object') return false;
        
        if (typeof quiz.name !== 'string') return false;
        if (typeof quiz.description !== 'string') return false;
        if (!Array.isArray(quiz.questions)) return false;
        
        for (const question of quiz.questions) {
            if (typeof question.questionText !== 'string') return false;
            if (!Array.isArray(question.answers)) return false;
            if (question.answers.length !== 4) return false;
            
            let correctAnswerCount = 0;
            for (const answer of question.answers) {
                if (typeof answer.answerText !== 'string') return false;
                if (typeof answer.isCorrect !== 'boolean') return false;
                if (answer.isCorrect) correctAnswerCount++;
            }
            
            // Ensure exactly one correct answer
            if (correctAnswerCount !== 1) return false;
        }
        
        return true;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
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
            temperature: 0.7,
            maxRetries: 3,
            timeout: 120000, // Increased timeout to 2 minutes
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
                                }
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

            1. Generate 5-10 comprehensive questions that cover the main topics
            2. Each question must:
               - Be clear and specific
               - Have exactly 4 answer choices
               - Have exactly ONE correct answer marked with isCorrect: true
               - Have all other answers marked with isCorrect: false
            3. Ensure proper JSON structure with all required fields
            4. Make sure the quiz is focused on testing comprehension of the main concepts

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

        const textContent = Array.isArray(text) ? text.join("\n") : text;
        // Limit text length to prevent timeouts
        const truncatedText = textContent.length > 10000 ? textContent.substring(0, 10000) + "..." : textContent;

        console.log("🧠 Sending request to OpenAI...");
        let result: unknown;
        try {
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${truncatedText}` }],
            });
            
            result = await runnable.invoke([message]);
            console.log("📝 Raw response:", JSON.stringify(result, null, 2));
            
            if (!validateQuizResult(result)) {
                throw new Error("Invalid quiz structure in response");
            }
        } catch (error) {
            console.error("❌ OpenAI API or validation error:", error);
            return NextResponse.json(
                { 
                    error: "Failed to generate valid quiz content",
                    details: error instanceof Error ? error.message : 'Unknown error'
                },
                { status: 500 }
            );
        }

        try {
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz(result.quizz);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: result.quizz.questions.length,
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
