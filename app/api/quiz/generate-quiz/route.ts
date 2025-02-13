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
                { error: "No text provided for quiz generation" },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI configuration error" },
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
                    text: `${prompt}\n${text}`,
                },
            ],
        });

        const result = await runnable.invoke([message]) as QuizResult;

        if (!result || !result.quizz) {
            return NextResponse.json(
                { error: "OpenAI returned invalid quiz structure" },
                { status: 500 }
            );
        }

        try {
            const { quizzId } = await saveQuizz(result.quizz);
            return NextResponse.json({ quizzId }, { status: 200 });
        } catch (dbError) {
            return NextResponse.json(
                { error: "Failed to save quiz to database" },
                { status: 500 }
            );
        }

    } catch (error: unknown) {
        let errorMessage = "Failed to generate quiz: ";
        
        if (error instanceof Error) {
            errorMessage += error.message;
        } else if (typeof error === 'string') {
            errorMessage += error;
        } else {
            errorMessage += "Unexpected error occurred";
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
