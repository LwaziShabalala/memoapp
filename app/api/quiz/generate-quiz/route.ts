import { NextRequest, NextResponse } from "next/server";
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
    // Your existing validation function
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
    // Your existing chunking function
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
    prompt: string, 
    chunkIndex: number, 
    totalChunks: number,
    apiKey: string
): Promise<QuizResult | null> {
    return new Promise(async (resolve) => {
        const timeoutId = setTimeout(() => {
            console.log(`⏱️ Timeout reached for chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(null);
        }, 25000);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4-turbo",
                    temperature: 0.7,
                    messages: [
                        {
                            role: "user",
                            content: `${prompt}\n\nContent to create quiz from:\n${chunk}`
                        }
                    ],
                    functions: [{
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
                    }],
                    function_call: { name: "extractor" }
                })
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }
            
            const data = await response.json();
            const functionCall = data.choices[0]?.message?.function_call;
            
            if (!functionCall || functionCall.name !== "extractor") {
                console.error(`❌ Invalid response format for chunk ${chunkIndex + 1}`);
                resolve(null);
                return;
            }
            
            const result = JSON.parse(functionCall.arguments);
            
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
    // Your existing merge function
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

// Use Edge Runtime
export const runtime = 'edge';

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

        try {
            // Enhanced prompt requesting more questions per chunk
            const basePrompt = `
                Create a quiz based on the following text. Follow these rules strictly:

                1. Generate exactly 10-15 high-quality multiple choice questions from this text chunk.
                2. Each question must:
                   - Be clear and specific.
                   - Have exactly 4 answer choices.
                   - Have exactly one correct answer.
                   - Cover important concepts, terminology, or procedures from the text.
                3. Include questions that test different levels of understanding (basic recall, comprehension, application).
                4. Ensure proper JSON structure with all required fields.
                5. Make the questions challenging but fair.
                6. Focus on the most important concepts in the text.
            `;

            const textContent = Array.isArray(text) ? text.join("\n") : text;
            const textChunks = chunkText(textContent, 4000);
            
            // Process fewer chunks (only 2)
            const maxChunksToProcess = Math.min(textChunks.length, 2);
            const chunksToProcess = textChunks.slice(0, maxChunksToProcess);

            console.log(`📊 Processing ${chunksToProcess.length} chunks from document`);

            // Process chunks sequentially instead of in parallel
            const results = [];
            
            for (let i = 0; i < chunksToProcess.length; i++) {
                const chunk = chunksToProcess[i];
                const prompt = basePrompt + `\n\nThis is part ${i+1} of ${chunksToProcess.length}.`;
                
                console.log(`🔄 Processing chunk ${i+1}/${chunksToProcess.length}`);
                const result = await processChunkWithTimeout(chunk, prompt, i, chunksToProcess.length, apiKey);
                
                if (result) {
                    results.push(result);
                    console.log(`✅ Chunk ${i+1} processed successfully with ${result.quizz.questions.length} questions`);
                }
            }

            console.log(`📋 Successfully processed ${results.length} out of ${chunksToProcess.length} chunks`);

            if (results.length === 0) {
                console.error("❌ No valid quiz content generated");
                return NextResponse.json({ error: "Failed to generate quiz content" }, { status: 500 });
            }
            
            const mergedResult = mergeQuizResults(results);
            console.log(`✅ Generated a total of ${mergedResult.quizz.questions.length} questions`);
            
            const result = await saveQuizz(mergedResult.quizz);
            
            return NextResponse.json({ 
                status: "success", 
                message: "Quiz generation completed",
                quizzId: result.quizzId,
                questionCount: mergedResult.quizz.questions.length
            });
        } catch (error) {
            console.error("❌ Unexpected error:", error);
            return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Unexpected error occurred", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
