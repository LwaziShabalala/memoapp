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

        // ✅ Log Request Headers & Body
        console.log("📥 Request Headers:", JSON.stringify(req.headers));
        const { text } = await req.json();
        console.log("📥 Received text input:", text);

        if (!text) {
            console.error("❌ Error: No text input provided.");
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        // ✅ Check if OpenAI API Key is Set
        if (!process.env.OPENAI_API_KEY) {
            console.error("❌ Error: OpenAI API key not provided.");
            return NextResponse.json(
                { error: "OpenAI API key not provided" },
                { status: 500 }
            );
        }
        console.log("✅ OpenAI API Key is available.");

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-3.5-turbo",
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts fields from output",
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
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const runnable = model
            .bind({
                functions: [extractionFunctionSchema],
                function_call: { name: "extractor" },
            })
            .pipe(parser);

        const prompt = `
            Given the text which is a summary of a document, generate a quiz based on the text. 
            Return JSON only that contains a quiz object with fields: name, description, and questions. 
            The questions should be an array of objects with fields: questionText, answers. 
            The answers should be an array of objects with fields: answerText, isCorrect.
        `;

        const message = new HumanMessage({
            content: [
                {
                    type: "text",
                    text: `${prompt}\n${textContent}`,
                },
            ],
        });

        console.log("🧠 [DEBUG] Sending request to OpenAI...");
        const result = await runnable.invoke([message]) as QuizResult;

        console.log("✅ OpenAI Response:", JSON.stringify(result, null, 2));

        // ✅ Ensure AI Response is Valid
        if (!result || !result.quizz) {
            console.error("❌ Error: OpenAI returned invalid quiz data.");
            return NextResponse.json(
                { error: "Failed to generate quiz data" },
                { status: 500 }
            );
        }

        console.log("📝 [DEBUG] Saving quiz to database...");
        const { quizzId } = await saveQuizz(result.quizz);
        console.log("✅ Quiz saved with ID:", quizzId);

        return NextResponse.json(
            { quizzId },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("❌ [ERROR] An error occurred:", error.message);
            console.error("🔍 Stack trace:", error.stack);

            return NextResponse.json(
                { error: "Internal Server Error", details: error.message, stack: error.stack },
                { status: 500 }
            );
        }

        console.error("❌ [ERROR] Unknown error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: "An unknown error occurred" },
            { status: 500 }
        );
    }
}
