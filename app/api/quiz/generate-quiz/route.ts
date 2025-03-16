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
            
            const correctAnswers = question.answers.filter(a => a.isCorrect);
            if (correctAnswers.length !== 1) return false;
            
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

function chunkText(text: string, maxChunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

async function processChunkWithTimeout(
    chunk: string, 
    model: ChatOpenAI, 
    runnable: ReturnType<typeof model.bind>, 
    prompt: string, 
    chunkIndex: number, 
    totalChunks: number
): Promise<QuizResult | null> {
    return new Promise(async (resolve) => {
        const timeoutId = setTimeout(() => {
            console.log(`⏱️ Timeout reached for chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(null);
        }, 45000);
        
        try {
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${chunk}` }],
            });
            
            const result = await runnable.invoke([message]);
            clearTimeout(timeoutId);
            
            if (!validateQuizResult(result)) {
                console.error(`❌ Invalid quiz structure in response for chunk ${chunkIndex + 1}`);
                resolve(null);
                return;
            }
            
            console.log(`✅ Successfully processed chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(result as QuizResult);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`❌ Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
            resolve(null);
        }
    });
}

function mergeQuizResults(results: QuizResult[]): QuizResult {
    if (results.length === 0) {
        throw new Error("No valid quiz results to merge");
    }
    
    if (results.length === 1) {
        return results[0];
    }
    
    let baseQuiz: Quiz = {
        name: "Generated Quiz",
        description: "Quiz generated from provided content",
        questions: []
    };
    
    for (const result of results) {
        if (result && result.quizz) {
            baseQuiz = {
                name: result.quizz.name,
                description: result.quizz.description,
                questions: []
            };
            break;
        }
    }
    
    for (const result of results) {
        if (result && result.quizz && result.quizz.questions) {
            baseQuiz.questions.push(...result.quizz.questions);
        }
    }
    
    return { quizz: baseQuiz };
}

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");
        
        const body = await req.json();
        const { text } = body;
        if (!text) {
            return NextResponse.json({ error: "Text input is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Missing OpenAI API key");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k",
            temperature: 0.7,
            maxRetries: 2,
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
        
        const runnable = model.bind({ functions: [extractionFunctionSchema], function_call: { name: "extractor" } }).pipe(parser);
        console.log("✅ Quiz generation API initialized");
    } catch (error) {
        console.error("❌ Error in POST handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
