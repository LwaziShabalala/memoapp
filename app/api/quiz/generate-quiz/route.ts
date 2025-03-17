import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { Runnable } from "@langchain/core/runnables";
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

// Increased the server timeout for Next.js route handlers
export const maxDuration = 60; // 60 seconds (adjust as needed)

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

function chunkText(text: string, maxChunkSize: number = 3000): string[] {
    // Reduced chunk size for faster processing
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
    runnable: Runnable<unknown, unknown>, 
    prompt: string, 
    chunkIndex: number, 
    totalChunks: number
): Promise<QuizResult | null> {
    return new Promise(async (resolve) => {
        const timeoutId = setTimeout(() => {
            console.log(`⏱️ Timeout reached for chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(null);
        }, 25000); // Increased timeout to 25 seconds for better completion chance
        
        try {
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${chunk}` }],
            });
            
            const result = await runnable.invoke([message]);
            clearTimeout(timeoutId);
            
            if (!validateQuizResult(result)) {
                console.error(`❌ Invalid quiz structure in response for chunk ${chunkIndex + 1}`);
                console.error('Received structure:', JSON.stringify(result, null, 2));
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
        
        // Parse request first before sending response
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

        // Use a different implementation without streaming
        try {
            const result = await generateQuiz(text, apiKey);
            console.log("📤 Sending response to client:", result);
            return NextResponse.json(result);
        } catch (error) {
            console.error("❌ Unexpected error:", error);
            return NextResponse.json({ error: "An unexpected error occurred", details: error.message }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Unexpected error occurred", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
}

// Separated quiz generation logic for better organization
async function generateQuiz(textInput: string, apiKey: string) {
    try {
        // Use GPT-3.5-turbo for faster processing (change back to gpt-4-turbo if needed)
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k", // Using 16k context for speed, can handle larger chunks
            temperature: 0.7,
            maxRetries: 2, // Increased retries
            timeout: 30000, // Increased timeout
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

        // Simplified prompt for faster processing
        const basePrompt = `
            Create a quiz based on this text. Rules:
            1. Generate 5-8 multiple choice questions.
            2. Each question must have 4 answer choices with exactly 1 correct answer.
            3. Cover key concepts from the text.
            4. Make questions clear and specific.
            5. Ensure the JSON structure perfectly matches the required format.
        `;

        const textContent = Array.isArray(textInput) ? textInput.join("\n") : textInput;
        const textChunks = chunkText(textContent, 3000); // Smaller chunks for faster processing
        
        // Process more chunks for better coverage
        const maxChunksToProcess = Math.min(textChunks.length, 2); // Increased to 2 chunks
        const chunksToProcess = textChunks.slice(0, maxChunksToProcess);

        console.log(`📊 Processing ${chunksToProcess.length} chunks from document`);

        // Process chunks sequentially
        const results = [];
        
        for (let i = 0; i < chunksToProcess.length; i++) {
            const chunk = chunksToProcess[i];
            const prompt = basePrompt + `\n\nThis is part ${i+1} of ${chunksToProcess.length}.`;
            
            console.log(`🔄 Processing chunk ${i+1}/${chunksToProcess.length}`);
            const result = await processChunkWithTimeout(chunk, model, runnable, prompt, i, chunksToProcess.length);
            
            if (result) {
                results.push(result);
                console.log(`✅ Chunk ${i+1} processed successfully with ${result.quizz.questions.length} questions`);
            }
        }

        console.log(`📋 Successfully processed ${results.length} out of ${chunksToProcess.length} chunks`);

        if (results.length === 0) {
            console.error("❌ No valid quiz content generated");
            return { error: "Failed to generate quiz content" };
        }
        
        const mergedResult = mergeQuizResults(results);
        console.log(`✅ Generated a total of ${mergedResult.quizz.questions.length} questions`);
        
        try {
            console.log(`🔄 Saving quiz to database with ${mergedResult.quizz.questions.length} questions`);
            const dbResult = await saveQuizz(mergedResult.quizz);
            console.log(`✅ Quiz saved to database with ID: ${dbResult.quizzId}`);
            
            return { 
                status: "success", 
                message: "Quiz generation completed",
                quizzId: dbResult.quizzId,
                questionCount: mergedResult.quizz.questions.length
            };
        } catch (dbError) {
            console.error("❌ Database save error:", dbError);
            return { 
                error: "Failed to save quiz to database", 
                message: dbError.message 
            };
        }
    } catch (error) {
        console.error("❌ Unexpected error in quiz generation:", error);
        return { error: "An unexpected error occurred during quiz generation", details: error.message };
    }
}
