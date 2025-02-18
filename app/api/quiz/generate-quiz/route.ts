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
    if (!result || typeof result !== 'object') return false;

    const quiz = (result as QuizResult).quizz;
    if (!quiz || typeof quiz !== 'object') return false;

    if (typeof quiz.name !== 'string') return false;
    if (typeof quiz.description !== 'string') return false;
    if (!Array.isArray(quiz.questions)) return false;

    for (const question of quiz.questions) {
        if (typeof question.questionText !== 'string') return false;
        if (!Array.isArray(question.answers) || question.answers.length !== 4) return false;

        for (const answer of question.answers) {
            if (typeof answer.answerText !== 'string') return false;
            if (typeof answer.isCorrect !== 'boolean') return false;
        }
    }
    return true;
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
            timeout: 60000,
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
                function_call: "extractor", // 🔹 Explicitly calls the function
            })
            .pipe(parser);

        const prompt = `
            Create a quiz based on the following text. Follow these rules strictly:

            1. Generate multiple comprehensive questions that cover the main topics
            2. Each question must:
               - Be clear and specific
               - Have exactly 4 answer choices
               - Have exactly one correct answer
            3. Ensure proper JSON structure with all required fields

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
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${textContent}` }],
            });
            
            result = await runnable.invoke([message]);

            // 🔹 Log raw response for debugging
            console.log("📝 Raw response:", JSON.stringify(result, null, 2));

            // 🔹 Ensure response is JSON and parse if necessary
            if (typeof result === "string") {
                try {
                    result = JSON.parse(result);
                } catch (error) {
                    console.error("❌ OpenAI returned invalid JSON:", result);
                    return NextResponse.json(
                        { error: "OpenAI response is not valid JSON", details: error.message },
                        { status: 500 }
                    );
                }
            }

            // 🔹 Validate structure
            if (!validateQuizResult(result)) {
                console.error("❌ Validation failed. OpenAI response:", result);
                return NextResponse.json(
                    { error: "Invalid quiz structure in OpenAI response" },
                    { status: 500 }
                );
            }
        } catch (error) {
            console.error("❌ OpenAI API or validation error:", error);
            return NextResponse.json(
                { error: "Failed to generate valid quiz content", details: error.message },
                { status: 500 }
            );
        }

        // 🔹 Save to database
        try {
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz((result as QuizResult).quizz);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: (result as QuizResult).quizz.questions.length
            }, { status: 200 });
        } catch (error) {
            console.error("❌ Database error:", error);
            return NextResponse.json(
                { error: "Failed to save quiz", details: error.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
