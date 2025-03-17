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
export const maxDuration = 120; // 120 seconds for complex processing

function validateQuizResult(result: unknown): result is QuizResult {
    try {
        if (!result || typeof result !== 'object') {
            console.log("❌ Validation failed: Result is not an object", result);
            return false;
        }
        
        const quiz = (result as QuizResult).quizz;
        if (!quiz || typeof quiz !== 'object') {
            console.log("❌ Validation failed: quizz property missing or not an object");
            return false;
        }
        
        if (typeof quiz.name !== 'string') {
            console.log("❌ Validation failed: quiz name not a string");
            return false;
        }
        if (typeof quiz.description !== 'string') {
            console.log("❌ Validation failed: quiz description not a string");
            return false;
        }
        if (!Array.isArray(quiz.questions)) {
            console.log("❌ Validation failed: quiz questions not an array");
            return false;
        }
        
        for (const [index, question] of quiz.questions.entries()) {
            if (typeof question.questionText !== 'string') {
                console.log(`❌ Validation failed: question ${index} text not a string`);
                return false;
            }
            if (!Array.isArray(question.answers)) {
                console.log(`❌ Validation failed: question ${index} answers not an array`);
                return false;
            }
            if (question.answers.length !== 4) {
                console.log(`❌ Validation failed: question ${index} doesn't have exactly 4 answers (has ${question.answers.length})`);
                return false;
            }
            
            const correctAnswers = question.answers.filter(a => a.isCorrect);
            if (correctAnswers.length !== 1) {
                console.log(`❌ Validation failed: question ${index} has ${correctAnswers.length} correct answers (should be 1)`);
                return false;
            }
            
            for (const [answerIndex, answer] of question.answers.entries()) {
                if (typeof answer.answerText !== 'string') {
                    console.log(`❌ Validation failed: answer text for question ${index}, answer ${answerIndex} is not a string`);
                    return false;
                }
                if (typeof answer.isCorrect !== 'boolean') {
                    console.log(`❌ Validation failed: isCorrect for question ${index}, answer ${answerIndex} is not a boolean`);
                    return false;
                }
            }
        }
        
        console.log(`✅ Validation passed: Quiz has ${quiz.questions.length} valid questions`);
        return true;
    } catch (error) {
        console.error('❌ Validation error:', error);
        return false;
    }
}

function chunkText(text: string, maxChunkSize: number = 3000): string[] {
    const chunks: string[] = [];
    
    // Handle extremely short inputs by returning them as a single chunk
    if (text.length <= maxChunkSize) {
        return [text];
    }
    
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // If paragraph itself is too long, split it
        if (paragraph.length > maxChunkSize) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            
            // Handle very long paragraphs by sentence splitting
            const sentences = paragraph.split(/(?<=[.!?])\s+/);
            let sentenceChunk = '';
            
            for (const sentence of sentences) {
                if (sentenceChunk.length + sentence.length > maxChunkSize && sentenceChunk.length > 0) {
                    chunks.push(sentenceChunk);
                    sentenceChunk = sentence;
                } else {
                    sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
                }
            }
            
            if (sentenceChunk) {
                chunks.push(sentenceChunk);
            }
        } else if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    if (currentChunk) {
        chunks.push(currentChunk);
    }
    
    console.log(`📊 Text split into ${chunks.length} chunks`);
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
        }, 50000); // Increased to 50 seconds for better completion chance
        
        try {
            console.log(`🔄 Chunk ${chunkIndex + 1}/${totalChunks} - Processing ${chunk.length} characters`);
            
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

// Create a fallback quiz when generation fails
function createFallbackQuiz(textInput: string): Quiz {
    // Extract a meaningful title from the first few sentences
    const titleMatch = textInput.match(/^(.{10,100}?)(?:[.!?]|$)/);
    const title = titleMatch ? titleMatch[1] : "Content Quiz";
    
    return {
        name: `Quiz on ${title}`,
        description: "A basic quiz about the provided content",
        questions: [
            {
                questionText: "What is the main topic discussed in this content?",
                answers: [
                    { answerText: "Please review the content and select the best answer", isCorrect: true },
                    { answerText: "This is not discussed in the content", isCorrect: false },
                    { answerText: "The content does not specify this", isCorrect: false },
                    { answerText: "None of the above", isCorrect: false }
                ]
            },
            {
                questionText: "Which of the following best summarizes the content?",
                answers: [
                    { answerText: "The content covers multiple technical concepts", isCorrect: false },
                    { answerText: "The content is primarily about theoretical frameworks", isCorrect: false },
                    { answerText: "Please review the content and select the best answer", isCorrect: true },
                    { answerText: "The content provides historical background information", isCorrect: false }
                ]
            }
        ]
    };
}

// Separated quiz generation logic for better organization
async function generateQuiz(textInput: string, apiKey: string) {
    try {
        console.log("🔍 Starting quiz generation process");
        console.log(`📊 Input text length: ${textInput.length} characters`);
        
        // Switch to GPT-4 for improved reliability if text is short enough
        const shouldUseGPT4 = textInput.length < 10000;
        const modelName = shouldUseGPT4 ? "gpt-4-turbo" : "gpt-3.5-turbo-16k";
        
        console.log(`🤖 Using model: ${modelName}`);
        
        // Initialize model with appropriate parameters
        const model = new ChatOpenAI({
            apiKey,
            modelName: modelName,
            temperature: 0.7,
            maxRetries: 3, // Increased retries
            timeout: 60000, // Increased timeout to 60 seconds
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

        // More detailed prompt with explicit instructions
        const basePrompt = `
            You are a professional quiz creator tasked with creating a high-quality quiz based on the provided content.
            
            QUIZ REQUIREMENTS:
            1. Generate 3-5 multiple choice questions that test understanding of key concepts.
            2. Each question MUST have EXACTLY 4 answer choices.
            3. Each question MUST have EXACTLY 1 correct answer marked with isCorrect: true.
            4. All other answers must have isCorrect: false.
            5. Questions should be clear, specific and directly based on the content.
            6. Create a meaningful name and description for the quiz.
            
            The output MUST follow this exact JSON structure without any deviations:
            {
              "quizz": {
                "name": "Quiz Name",
                "description": "Brief description of the quiz",
                "questions": [
                  {
                    "questionText": "Question 1",
                    "answers": [
                      {"answerText": "Answer 1", "isCorrect": true},
                      {"answerText": "Answer 2", "isCorrect": false},
                      {"answerText": "Answer 3", "isCorrect": false},
                      {"answerText": "Answer 4", "isCorrect": false}
                    ]
                  }
                ]
              }
            }
        `;

        const textContent = Array.isArray(textInput) ? textInput.join("\n") : textInput;
        const textChunks = chunkText(textContent, 4000); // Adjusted chunk size
        
        // Process chunks based on content length
        let maxChunksToProcess = 1;
        if (textContent.length > 5000) maxChunksToProcess = 2;
        if (textContent.length > 15000) maxChunksToProcess = 3;
        
        maxChunksToProcess = Math.min(textChunks.length, maxChunksToProcess);
        const chunksToProcess = textChunks.slice(0, maxChunksToProcess);

        console.log(`📊 Processing ${chunksToProcess.length} chunks from document`);

        // Process chunks with multiple attempts
        const results = [];
        const maxAttempts = 2; // Try up to twice per chunk
        
        for (let i = 0; i < chunksToProcess.length; i++) {
            const chunk = chunksToProcess[i];
            let success = false;
            
            for (let attempt = 1; attempt <= maxAttempts && !success; attempt++) {
                if (attempt > 1) {
                    console.log(`🔄 Retry attempt ${attempt} for chunk ${i+1}`);
                }
                
                const prompt = `${basePrompt}\n\nThis is part ${i+1} of ${chunksToProcess.length}.`;
                console.log(`🔄 Processing chunk ${i+1}/${chunksToProcess.length}`);
                
                const result = await processChunkWithTimeout(chunk, model, runnable, prompt, i, chunksToProcess.length);
                
                if (result) {
                    results.push(result);
                    console.log(`✅ Chunk ${i+1} processed successfully with ${result.quizz.questions.length} questions`);
                    success = true;
                }
            }
        }

        console.log(`📋 Successfully processed ${results.length} out of ${chunksToProcess.length} chunks`);

        // Use fallback if no valid results
        if (results.length === 0) {
            console.warn("⚠️ No valid quiz content generated, using fallback quiz");
            const fallbackQuiz = createFallback
