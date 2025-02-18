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
            temperature: 1.0, // Increased to allow more creativity
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
                                            minItems: 4,
                                            maxItems: 4 // Keep exactly 4 answers per question
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

        // Updated prompt to remove any constraints on the number of questions
        const prompt = `
            Generate a quiz from the provided text. Extract as many questions as you see fit, depending on:
            1. The depth and richness of the content
            2. The number of key concepts present
            3. The complexity of the material

            IMPORTANT:
            - Do NOT limit the number of questions. Generate as many or as few as necessary.
            - Each question must test a unique idea from the text.
            - The number of questions should be **purely content-driven**.

            The output structure should be:
            {
              "quizz": {
                "name": "Quiz Title",
                "description": "Brief description",
                "questions": [
                  {
                    "questionText": "Question here",
                    "answers": [
                      {"answerText": "Option 1", "isCorrect": true},
                      {"answerText": "Option 2", "isCorrect": false},
                      {"answerText": "Option 3", "isCorrect": false},
                      {"answerText": "Option 4", "isCorrect": false}
                    ]
                  }
                ]
              }
            }

            Remember: The number of questions should **naturally vary** based on content. Do NOT use a fixed number.
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

            // Log raw OpenAI response for debugging
            console.log("🔍 [DEBUG] RAW RESPONSE:", JSON.stringify(result, null, 2));
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
