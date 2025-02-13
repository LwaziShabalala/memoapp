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
        // Log the start of the request
        console.log('[Quiz Generation] Starting quiz generation');
        
        const { text } = await req.json();
        console.log('[Quiz Generation] Input length:', text?.length || 0);

        if (!text) {
            console.error('[Quiz Generation] No input text provided');
            throw new Error("Text input is required");
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error('[Quiz Generation] Missing OpenAI API key in environment');
            throw new Error("OpenAI API key not configured");
        }

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

        console.log('[Quiz Generation] Making OpenAI request');
        const runnable = model
            .bind({
                functions: [extractionFunctionSchema],
                function_call: { name: "extractor" },
            })
            .pipe(parser);

        const prompt =
            "Given the text which is a summary of the document, generate a quiz based on the text. Return JSON only that contains a quiz object with fields: name, description, and questions. The questions should be an array of objects with fields: questionText, answers. The answers should be an array of objects with fields: answerText, isCorrect.";

        const message = new HumanMessage({
            content: [
                {
                    type: "text",  
                    text: `${prompt}\n${text}`,
                },
            ],
        });

        const result = await runnable.invoke([message]) as QuizResult;
        
        // Log the shape of the result without sensitive data
        console.log('[Quiz Generation] Result structure:', {
            hasQuizz: !!result?.quizz,
            questionCount: result?.quizz?.questions?.length,
            hasName: !!result?.quizz?.name,
            hasDescription: !!result?.quizz?.description
        });

        if (!result?.quizz) {
            console.error('[Quiz Generation] Invalid result structure:', JSON.stringify(result));
            throw new Error("Quiz generation failed: Invalid response structure");
        }

        console.log('[Quiz Generation] Saving to database');
        const { quizzId } = await saveQuizz(result.quizz);
        console.log('[Quiz Generation] Successfully saved quiz:', quizzId);

        return NextResponse.json({ quizzId }, { status: 200 });

    } catch (error: unknown) {
        // Log full error details to Vercel logs
        console.error('[Quiz Generation] Error:', {
            type: error instanceof Error ? error.constructor.name : typeof error,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace',
            timestamp: new Date().toISOString()
        });

        // Return a clean error to the client
        return NextResponse.json(
            { error: "Quiz generation failed", id: new Date().toISOString() },
            { status: 500 }
        );
    }
}
