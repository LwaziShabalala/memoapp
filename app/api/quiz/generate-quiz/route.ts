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
        if (!text) {
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

        // Use a function expression instead of a function declaration
        const safeApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
            try {
                return await apiCall();
            } catch (error) {
                // Capture the full error message
                const fullError = String(error);
                console.error("API Call Error:", fullError);
                
                // Check for timeout errors
                if (fullError.includes("FUNCTION_INVOCATION_TIMEOUT") || 
                    fullError.includes("timeout") || 
                    fullError.includes("timed out")) {
                    throw new Error("TIMEOUT");
                }
                
                throw error;
            }
        };

        const runnable = model
            .bind({
                functions: [extractionFunctionSchema],
                function_call: { name: "extractor" },
            })
            .pipe(parser);

        // Set a more compact prompt to reduce token usage
        const prompt = `
            Create a quiz from this text with multiple key questions.
            Each question must have exactly 4 answer choices with only one correct answer.
        `;

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        // Chunk processing logic
        const MAX_CHUNK_SIZE = 3000; // Reduced for faster processing
        let finalResult: QuizResult = {
            quizz: {
                name: "Generated Quiz",
                description: "Quiz generated from provided text",
                questions: []
            }
        };

        try {
            console.log(`📏 Text length: ${textContent.length} chars`);
            
            if (textContent.length > MAX_CHUNK_SIZE) {
                // Break into paragraphs first
                const paragraphs = textContent.split(/\n\s*\n/);
                const chunks: string[] = [];
                let currentChunk = "";
                
                // Build chunks from paragraphs
                for (const paragraph of paragraphs) {
                    if (currentChunk.length + paragraph.length > MAX_CHUNK_SIZE) {
                        chunks.push(currentChunk);
                        currentChunk = paragraph;
                    } else {
                        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
                    }
                }
                
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                console.log(`🧩 Processing ${chunks.length} chunks`);
                
                // Process chunks in sequence
                let questionsGenerated = 0;
                
                for (let i = 0; i < chunks.length && questionsGenerated < 10; i++) {
                    const chunk = chunks[i];
                    console.log(`⚙️ Processing chunk ${i+1}/${chunks.length}`);
                    
                    try {
                        const chunkPrompt = `
                            Create 2-3 quiz questions from this content (part ${i+1} of ${chunks.length}).
                            Each question needs exactly 4 answer choices with only one correct answer.
                        `;
                        
                        const message = new HumanMessage({
                            content: [{ type: "text", text: `${chunkPrompt}\n\nContent:\n${chunk}` }],
                        });
                        
                        // Use the safe API call wrapper
                        const chunkResult = await safeApiCall(() => runnable.invoke([message]));
                        
                        if (validateQuizResult(chunkResult)) {
                            finalResult.quizz.questions = [
                                ...finalResult.quizz.questions,
                                ...chunkResult.quizz.questions
                            ];
                            
                            questionsGenerated += chunkResult.quizz.questions.length;
                            console.log(`✅ Got ${chunkResult.quizz.questions.length} questions from chunk ${i+1}`);
                            
                            // Stop if we have enough questions
                            if (questionsGenerated >= 10) {
                                console.log("🎯 Reached target question count, stopping");
                                break;
                            }
                        }
                    } catch (error: unknown) {
                        if (error instanceof Error && error.message === "TIMEOUT") {
                            console.log(`⏱️ Timeout on chunk ${i+1}, skipping to next chunk`);
                            continue;
                        } else {
                            console.error(`❌ Error on chunk ${i+1}:`, error);
                        }
                    }
                }
                
                // If we generated at least some questions, consider it a success
                if (finalResult.quizz.questions.length > 0) {
                    console.log(`🎯 Generated ${finalResult.quizz.questions.length} questions total`);
                } else {
                    throw new Error("Failed to generate any questions from the text");
                }
            } else {
                // Process as a single chunk
                console.log("📝 Processing text as a single chunk");
                
                const message = new HumanMessage({
                    content: [{ type: "text", text: `${prompt}\n\nContent:\n${textContent}` }],
                });
                
                // Use the safe API call wrapper
                const result = await safeApiCall(() => runnable.invoke([message]));
                
                if (validateQuizResult(result)) {
                    finalResult = result;
                    console.log(`✅ Generated ${finalResult.quizz.questions.length} questions`);
                } else {
                    throw new Error("Invalid quiz structure in response");
                }
            }

            // Save to database
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz(finalResult.quizz);
            
            return NextResponse.json({ 
                quizzId, 
                questionCount: finalResult.quizz.questions.length 
            }, { status: 200 });
            
        } catch (error: unknown) {
            console.error("❌ Error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Always return a proper JSON response
            return NextResponse.json({ 
                error: errorMessage.includes("TIMEOUT") 
                    ? "The text is too long to process. Please try with a shorter text." 
                    : "Failed to generate quiz questions",
                details: errorMessage
            }, { status: errorMessage.includes("TIMEOUT") ? 504 : 500 });
        }
    } catch (error: unknown) {
        console.error("❌ Unexpected error:", error);
        // Ensure we always return proper JSON
        return NextResponse.json({ 
            error: "Internal server error", 
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
