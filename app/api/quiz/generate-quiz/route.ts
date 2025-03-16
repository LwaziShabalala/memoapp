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
            
            for (const answer of question.answers) {
                if (typeof answer.answerText !== 'string') return false;
                if (typeof answer.isCorrect !== 'boolean') return false;
            }
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

        // Check if the text is too long (rough estimate)
        const textLength = Array.isArray(text) ? text.join("\n").length : text.length;
        if (textLength > 15000) {
            return NextResponse.json(
                { error: "Text input is too long. Please provide shorter content to avoid timeouts." },
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

        // Increased timeout and added retry parameters
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k",
            temperature: 0.7,
            maxRetries: 5,
            retryDelay: 1000,
            timeout: 180000, // Increased from 60000 to 180000 (3 minutes)
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
                                // Limit the number of questions to avoid timeouts
                                maxItems: 10
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

        // Simplified prompt to reduce complexity
        const prompt = `
            Create a quiz based on the following text. Follow these rules strictly:

            1. Generate up to 10 focused questions that cover key concepts
            2. Each question must:
               - Be clear and specific
               - Have exactly 4 answer choices
               - Have exactly one correct answer
            3. Ensure proper JSON structure

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

        console.log("🧠 Sending request to OpenAI...");
        let result: unknown;
        try {
            // Set up a timeout promise in addition to the API's own timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out after 3 minutes")), 180000);
            });
            
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${textContent}` }],
            });
            
            // Race the API call against the timeout
            result = await Promise.race([
                runnable.invoke([message]),
                timeoutPromise
            ]);
            
            console.log("📝 Raw response:", JSON.stringify(result, null, 2));
            
            if (!validateQuizResult(result)) {
                throw new Error("Invalid quiz structure in response");
            }
        } catch (error) {
            console.error("❌ OpenAI API or validation error:", error);
            
            // Check specifically for timeout errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const isTimeout = errorMessage.includes('TIMEOUT') || 
                              errorMessage.includes('timed out') ||
                              errorMessage.includes('FUNCTION_INVOCATION_TIMEOUT');
            
            return NextResponse.json(
                { 
                    error: isTimeout 
                        ? "Request timed out - please try with shorter content or fewer questions" 
                        : "Failed to generate valid quiz content",
                    details: errorMessage
                },
                { status: isTimeout ? 504 : 500 }
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
