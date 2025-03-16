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
            
            // Verify we have exactly one correct answer
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

// Function to chunk text into small enough pieces
function chunkText(text: string, maxChunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    
    // Split by paragraphs to avoid cutting in the middle of sentences
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size, save current chunk and start a new one
        if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    // Add the last chunk if not empty
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

// Function to process a single chunk with timeout protection
async function processChunkWithTimeout(
    chunk: string, 
    model: ChatOpenAI, 
    runnable: any, 
    prompt: string, 
    chunkIndex: number, 
    totalChunks: number
): Promise<QuizResult | null> {
    return new Promise(async (resolve) => {
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
            console.log(`⏱️ Timeout reached for chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(null);
        }, 45000); // 45 second timeout per chunk
        
        try {
            const message = new HumanMessage({
                content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${chunk}` }],
            });
            
            const result = await runnable.invoke([message]);
            clearTimeout(timeoutId); // Clear timeout if successful
            
            if (!validateQuizResult(result)) {
                console.error(`❌ Invalid quiz structure in response for chunk ${chunkIndex + 1}`);
                resolve(null);
                return;
            }
            
            console.log(`✅ Successfully processed chunk ${chunkIndex + 1}/${totalChunks}`);
            resolve(result as QuizResult);
        } catch (error) {
            clearTimeout(timeoutId); // Clear timeout if error occurs
            console.error(`❌ Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
            resolve(null);
        }
    });
}

// Function to merge quiz results from multiple chunks
function mergeQuizResults(results: QuizResult[]): QuizResult {
    if (results.length === 0) {
        throw new Error("No valid quiz results to merge");
    }
    
    if (results.length === 1) {
        return results[0];
    }
    
    // Create a sample quiz structure if we have no valid results
    let baseQuiz: Quiz = {
        name: "Generated Quiz",
        description: "Quiz generated from provided content",
        questions: []
    };
    
    // Find the first valid result to use as a base
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
    
    // Add questions from all chunks
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
        
        // Send an immediate response to prevent timeout for large files
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('{"status":"processing"}'));
            }
        });
        
        const response = new Response(stream, {
            headers: {
                'Content-Type': 'application/json',
                'Transfer-Encoding': 'chunked'
            }
        });
        
        let body: { text?: string };
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
        if (!text) {
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Missing OpenAI API key");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        // Create a background task to process the request
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

                    1. Generate 2-3 comprehensive questions that cover the main topics in this text chunk
                    2. Each question must:
                       - Be clear and specific
                       - Have exactly 4 answer choices
                       - Have exactly one correct answer
                    3. Ensure proper JSON structure with all required fields

                    Important: Your response must be valid JSON matching this exact structure:
                    {
                      "quizz": {
                        "name": "string",
                        "description": "string",
                        "questions": [
                          {
                            "questionText": "string",
                            "answers": [
                              {"answerText": "string", "isCorrect": boolean},
                              {"answerText": "string", "isCorrect": boolean},
                              {"answerText": "string", "isCorrect": boolean},
                              {"answerText": "string", "isCorrect": boolean}
                            ]
                          }
                        ]
                      }
                    }
                `;

                const textContent = Array.isArray(text) ? text.join("\n") : text;
                // Use smaller chunks to prevent timeouts
                const textChunks = chunkText(textContent, 4000);
                console.log(`🧩 Split input into ${textChunks.length} chunks`);
                
                // Process only the first 10 chunks to prevent excessive processing
                const chunksToProcess = textChunks.slice(0, 10);
                console.log(`🔍 Processing first ${chunksToProcess.length} chunks to generate quiz`);
                
                // Process chunks in parallel with individual timeouts
                const chunkPromises = chunksToProcess.map((chunk, index) => {
                    let prompt = basePrompt;
                    if (chunksToProcess.length > 1) {
                        prompt += `\n\nThis is part ${index+1} of ${chunksToProcess.length} from the text. Focus on creating 2-3 high-quality questions specific to this section.`;
                    }
                    
                    return processChunkWithTimeout(chunk, model, runnable, prompt, index, chunksToProcess.length);
                });
                
                // Wait for all chunks to complete or timeout
                const results = await Promise.all(chunkPromises);
                const validResults = results.filter(result => result !== null) as QuizResult[];
                
                if (validResults.length === 0) {
                    console.error("❌ No valid quiz content generated from any chunk");
                    return;
                }
                
                // Merge results from all successful chunks
                const mergedResult = mergeQuizResults(validResults);
                console.log(`✅ Successfully generated quiz with ${mergedResult.quizz.questions.length} questions`);

                try {
                    console.log("💾 Saving quiz to database...");
                    const { quizzId } = await saveQuizz(mergedResult.quizz);
                    
                    console.log(`✅ Quiz saved with ID: ${quizzId}`);
                } catch (error) {
                    console.error("❌ Database error:", error);
                }
            } catch (error) {
                console.error("❌ Unexpected error in background task:", error);
            }
        })();
        
        // Return a response immediately while processing continues in the background
        return NextResponse.json({ 
            status: "processing",
            message: "Quiz generation started. This may take a few minutes."
        }, { status: 202 });
        
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
