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
                if (typeof answer.answerText !== 'string' || typeof answer.isCorrect !== 'boolean') return false;
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
    runnable: T, 
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
        
        let body: { text?: string };
        try {
            body = await req.json();
        } catch (e) {
            console.error("❌ Error parsing request body:", e);
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { text } = body;
        if (!text) {
            return NextResponse.json({ error: "Text input is required" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Missing OpenAI API key");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        (async () => {
            try {
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

                const runnable = model
                    .bind({
                        functions: [extractionFunctionSchema],
                        function_call: { name: "extractor" },
                    })
                    .pipe(parser);

                const basePrompt = `
                    Create a quiz based on the following text. Follow these rules strictly:

                    1. Generate 2-3 comprehensive questions that cover the main topics in this text chunk.
                    2. Each question must:
                       - Be clear and specific.
                       - Have exactly 4 answer choices.
                       - Have exactly one correct answer.
                    3. Ensure proper JSON structure with all required fields.
                `;

                const textContent = Array.isArray(text) ? text.join("\n") : text;
                const textChunks = chunkText(textContent, 4000);
                const chunksToProcess = textChunks.slice(0, 10);

                const chunkPromises = chunksToProcess.map((chunk, index) => {
                    const prompt = basePrompt + `\n\nThis is part ${index+1} of ${chunksToProcess.length}.`;
                    return processChunkWithTimeout(chunk, model, runnable, prompt, index, chunksToProcess.length);
                });

                const results = await Promise.all(chunkPromises);
                const validResults = results.filter(result => result !== null) as QuizResult[];

                if (validResults.length === 0) {
                    console.error("❌ No valid quiz content generated");
                    return;
                }
                
                const mergedResult = mergeQuizResults(validResults);
                await saveQuizz(mergedResult.quizz);
            } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
}

        })();

        return NextResponse.json({ status: "processing", message: "Quiz generation started." }, { status: 202 });

    } catch {
    console.error("❌ Unexpected error occurred");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

}
