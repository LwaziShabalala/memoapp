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

// Function to chunk text for large inputs
function chunkText(text: string, chunkSize: number = 8000): string[] {
    const chunks: string[] = [];
    
    // Split by paragraphs to avoid cutting in the middle of sentences
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size, save current chunk and start a new one
        if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
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

// Function to merge quiz results from multiple chunks
function mergeQuizResults(results: QuizResult[]): QuizResult {
    if (results.length === 0) {
        throw new Error("No valid quiz results to merge");
    }
    
    if (results.length === 1) {
        return results[0];
    }
    
    const firstResult = results[0];
    const mergedQuiz: Quiz = {
        name: firstResult.quizz.name,
        description: firstResult.quizz.description,
        questions: [...firstResult.quizz.questions]
    };
    
    // Add questions from other chunks
    for (let i = 1; i < results.length; i++) {
        mergedQuiz.questions.push(...results[i].quizz.questions);
    }
    
    return { quizz: mergedQuiz };
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
            console.error("❌ Missing OpenAI API key");
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
            timeout: 180000, // Increased timeout to 3 minutes
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

            1. Generate multiple comprehensive questions that cover the main topics
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
        const textChunks = chunkText(textContent);
        console.log(`🧩 Split input into ${textChunks.length} chunks`);
        
        const results: QuizResult[] = [];
        
        // Process each chunk
        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            console.log(`🧠 Processing chunk ${i+1}/${textChunks.length} (${chunk.length} characters)`);
            
            let prompt = basePrompt;
            if (textChunks.length > 1) {
                prompt += `\n\nThis is part ${i+1} of ${textChunks.length} from the text. Focus on creating questions specific to this section.`;
            }
            
            try {
                const message = new HumanMessage({
                    content: [{ type: "text", text: `${prompt}\n\nContent to create quiz from:\n${chunk}` }],
                });
                
                const result = await runnable.invoke([message]);
                console.log(`📝 Raw response received for chunk ${i+1}`);
                
                if (!validateQuizResult(result)) {
                    throw new Error(`Invalid quiz structure in response for chunk ${i+1}`);
                }
                
                results.push(result as QuizResult);
            } catch (error) {
                console.error(`❌ Error processing chunk ${i+1}:`, error);
                // Continue with other chunks if one fails
            }
        }
        
        if (results.length === 0) {
            return NextResponse.json(
                { error: "Failed to generate valid quiz content from any text chunk" },
                { status: 500 }
            );
        }
        
        // Merge results from all chunks
        const mergedResult = mergeQuizResults(results);
        console.log(`✅ Successfully generated quiz with ${mergedResult.quizz.questions.length} questions`);

        try {
            console.log("💾 Saving quiz to database...");
            const { quizzId } = await saveQuizz(mergedResult.quizz);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: mergedResult.quizz.questions.length
            }, { status: 200 });
        } catch (error) {
            console.error("❌ Database error:", error);
            return NextResponse.json(
                { error: "Failed to save quiz", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
