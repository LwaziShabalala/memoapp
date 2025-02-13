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
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        if (!process.env.OPENAI_API_KEY) {
            console.error("OpenAI API key not provided");
            return NextResponse.json(
                { error: "OpenAI API key not provided" },
                { status: 500 }
            );
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
                    text: `${prompt}\n${textContent}`,
                },
            ],
        });

        const result = await runnable.invoke([message]) as QuizResult;

        console.log('Generated quiz result:', JSON.stringify(result, null, 2));  // Log the full result

        // Check if the result has the 'quizz' property
        if (!result || !result.quizz) {
            console.error('Invalid quiz result:', result);  // Log the invalid result
            return NextResponse.json(
                { error: "Failed to generate quiz data", details: "Missing quiz structure" },
                { status: 500 }
            );
        }

        const { quizzId } = await saveQuizz(result.quizz);

        return NextResponse.json(
            { quizzId },
            { status: 200 }
        );
    } catch (error: unknown) {
        // Log the full error details
        console.error('Full error object:', error);
        
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);

            return NextResponse.json(
                { 
                    error: "Quiz generation failed",
                    message: error.message,
                    stack: error.stack 
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                error: "Quiz generation failed",
                details: "An unknown error occurred",
                errorObject: JSON.stringify(error)
            },
            { status: 500 }
        );
    }
}
