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

        // Validate API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Error: OpenAI API key not found in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }
        console.log("✅ OpenAI API Key is available");

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        // Initialize OpenAI with error handling
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo",
            temperature: 0.7,
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts quiz data from the provided text",
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
                                            minItems: 2
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

        // Simplified prompt that lets the AI decide the number of questions
        const prompt = `
            Given the text which is a summary of a document, generate a comprehensive quiz based on the text. 
            Return JSON only that contains a quiz object with fields: name, description, and questions. 
            
            Generate as many questions as you think are appropriate to thoroughly test understanding of the key concepts in the content.
            
            Requirements for each question:
            - Each question should have exactly 4 answer options
            - Only one answer should be correct
            - Questions should test understanding rather than just memorization
            - Questions should cover different aspects of the content
            
            The questions array should contain objects with fields: questionText, answers. 
            The answers should be an array of objects with fields: answerText, isCorrect.
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

        console.log("✅ OpenAI Response received");

        // Validate quiz structure
        if (!result?.quizz?.questions?.length) {
            console.error("❌ Error: Invalid quiz structure returned from OpenAI");
            return NextResponse.json(
                { error: "Invalid quiz structure generated" },
                { status: 500 }
            );
        }

        // Save to database with error handling
        try {
            console.log("📝 [DEBUG] Saving quiz to database...");
            const { quizzId } = await saveQuizz(result.quizz);
            console.log("✅ Quiz saved with ID:", quizzId);
            
            return NextResponse.json({ quizzId }, { status: 200 });
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
            { 
                error: "Internal Server Error", 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
