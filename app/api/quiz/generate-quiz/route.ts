import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import saveQuizz from "./saveToDb";

interface QuizResult {
    quizz: {
        name: string;
        description: string;
        questions: {
            questionText: string;
            answers: {
                answerText: string;
                isCorrect: boolean;
            }[];
        }[];
    };
}

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");

        // Parse and validate request body
        let body;
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
        console.log("📥 Received text input length:", text?.length || 0);

        if (!text) {
            console.error("❌ Error: No text input provided.");
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Error: OpenAI API key not found in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        // Initialize OpenAI with higher temperature for more variety
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k", // Using 16k model for longer context
            temperature: 1.0,
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts comprehensive quiz data from the provided text",
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
                                // Removed any maxItems constraint to allow unlimited questions
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

        // Enhanced prompt to encourage more comprehensive question generation
        const prompt = `
            Generate a comprehensive quiz from the provided text. You should generate many questions to thoroughly test understanding of the material.

            CRITICAL REQUIREMENTS:
            1. Generate AT LEAST 10 questions, but preferably more based on content density
            2. Cover ALL major topics and subtopics in the text
            3. Include a mix of question types:
               - Factual recall
               - Concept understanding
               - Application of knowledge
               - Technical details
            4. Each question must test a unique concept
            5. Avoid redundant or overlapping questions
            6. Questions should vary in difficulty

            The number of questions should be based on:
            - The depth and breadth of the content
            - The number of distinct concepts
            - The complexity of the material
            - The amount of technical detail

            DO NOT artificially limit the number of questions. Generate as many as needed to properly test the material.

            Format each question with exactly 4 answer choices, where only one is correct.
        `;

        console.log("🧠 [DEBUG] Sending request to OpenAI...");
        let result: QuizResult;
        try {
            const message = new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: `${prompt}\n${textContent}`,
                    },
                ],
            });
            result = await runnable.invoke([message]) as QuizResult;
        } catch (error) {
            console.error("❌ OpenAI API Error:", error);
            return NextResponse.json(
                { error: "Failed to generate quiz content", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }

        if (!result?.quizz?.questions?.length) {
            console.error("❌ Error: Invalid quiz structure returned from OpenAI");
            return NextResponse.json(
                { error: "Invalid quiz structure generated" },
                { status: 500 }
            );
        }

        // Add validation for minimum number of questions
        if (result.quizz.questions.length < 10) {
            console.error("❌ Error: Insufficient number of questions generated");
            return NextResponse.json(
                { error: "Generated quiz does not meet minimum question requirement" },
                { status: 500 }
            );
        }

        try {
            console.log("📝 [DEBUG] Saving quiz to database...");
            const { quizzId } = await saveQuizz(result.quizz);
            console.log("✅ Quiz saved with ID:", quizzId);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: result.quizz.questions.length // Added for monitoring
            }, { status: 200 });
        } catch (error) {
            console.error("❌ Database Error:", error);
            return NextResponse.json(
                { error: "Failed to save quiz", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
