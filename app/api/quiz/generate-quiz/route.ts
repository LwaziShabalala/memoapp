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

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");

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
        if (!text) {  // Only check if text exists, no length limit
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k",
            temperature: 0.7,
            maxRetries: 3,
            timeout: 120000, // 120 seconds timeout
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

        const prompt = `
            Create a quiz based on the following text. Follow these rules strictly:
            - Generate multiple comprehensive questions covering the main topics
            - Each question must have exactly 4 answer choices and one correct answer
            - Ensure proper JSON structure with all required fields
        `;

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        console.log("🧠 Processing text content...");
        
        // Chunk processing logic
        const MAX_CHUNK_SIZE = 4000; // characters
        let finalResult: QuizResult = {
            quizz: {
                name: "Generated Quiz",
                description: "Quiz generated from provided text",
                questions: []
            }
        };

        try {
            if (textContent.length > MAX_CHUNK_SIZE) {
                console.log(`📏 Text length: ${textContent.length} chars - splitting into chunks`);
                // Split text into sentences to avoid cutting in the middle of sentences
                const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
                
                // Group sentences into chunks
                const chunks: string[] = [];
                let currentChunk = "";
                
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
                        chunks.push(currentChunk);
                        currentChunk = sentence;
                    } else {
                        currentChunk += sentence;
                    }
                }
                
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                console.log(`🧩 Created ${chunks.length} chunks for processing`);
                
                // Process each chunk
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    console.log(`⚙️ Processing chunk ${i+1}/${chunks.length} (${chunk.length} chars)...`);
                    
                    try {
                        const chunkPrompt = `
                            Create a quiz based on the following text (Part ${i+1} of ${chunks.length}). Follow these rules strictly:
                            - Generate 3-5 comprehensive questions covering key topics in this section
                            - Each question must have exactly 4 answer choices and one correct answer
                            - Ensure proper JSON structure with all required fields
                        `;
                        
                        const message = new HumanMessage({
                            content: [{ type: "text", text: `${chunkPrompt}\n\nContent:\n${chunk}` }],
                        });
                        
                        const chunkResult = await runnable.invoke([message]);
                        
                        if (validateQuizResult(chunkResult)) {
                            // Add these questions to our final result
                            finalResult.quizz.questions = [
                                ...finalResult.quizz.questions,
                                ...chunkResult.quizz.questions
                            ];
                            console.log(`✅ Successfully processed chunk ${i+1}, got ${chunkResult.quizz.questions.length} questions`);
                        } else {
                            console.error(`❌ Invalid result structure from chunk ${i+1}`);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error 
                            ? error.message 
                            : String(error);
                        console.error(`❌ Error processing chunk ${i+1}:`, errorMessage);
                        // Continue with next chunk
                    }
                }
                
                // If we got no questions at all, that's an error
                if (finalResult.quizz.questions.length === 0) {
                    throw new Error("Failed to generate any valid questions from all text chunks");
                }
                
                console.log(`🎯 Successfully generated ${finalResult.quizz.questions.length} questions in total`);
            } else {
                // Process the text as a single chunk for smaller texts
                console.log(`📏 Text length: ${textContent.length} chars - processing as single chunk`);
                const message = new HumanMessage({
                    content: [{ type: "text", text: `${prompt}\n\nContent:\n${textContent}` }],
                });
                
                const result = await runnable.invoke([message]);
                
                if (!validateQuizResult(result)) {
                    throw new Error("Invalid quiz structure in response");
                }
                
                finalResult = result;
                console.log(`✅ Successfully generated ${finalResult.quizz.questions.length} questions`);
            }

            // Save to database
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz(finalResult.quizz);
            return NextResponse.json({ 
                quizzId, 
                questionCount: finalResult.quizz.questions.length 
            }, { status: 200 });
            
        } catch (error) {
            console.error("❌ Processing error:", error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : typeof error === 'string' 
                    ? error 
                    : String(error);
                    
            if (errorMessage.includes("FUNCTION_INVOCATION_TIMEOUT")) {
                return NextResponse.json(
                    { error: "The quiz generation took too long. The system attempted to process your text in chunks but still encountered timeouts." },
                    { status: 504 }
                );
            }
            return NextResponse.json(
                { error: "Failed to generate valid quiz content", details: errorMessage },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'string'
                ? error
                : String(error);
        return NextResponse.json(
            { error: "Internal server error", details: errorMessage },
            { status: 500 }
        );
    }
}
