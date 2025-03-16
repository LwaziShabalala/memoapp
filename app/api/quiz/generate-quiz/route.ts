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

// Enhanced validation function
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

// Function to split text into smaller chunks
function splitTextIntoChunks(text: string, maxChunkSize: number = 3000): string[] {
    if (text.length <= maxChunkSize) {
        return [text];
    }
    
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed the chunk size, start a new chunk
        if (currentChunk.length + paragraph.length > maxChunkSize) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            
            // If the paragraph itself is too long, split it further
            if (paragraph.length > maxChunkSize) {
                // Split by sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length > maxChunkSize) {
                        if (currentChunk.length > 0) {
                            chunks.push(currentChunk);
                            currentChunk = '';
                        }
                        chunks.push(sentence);
                    } else {
                        currentChunk += (currentChunk ? ' ' : '') + sentence;
                    }
                }
            } else {
                chunks.push(paragraph);
            }
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

// Function to generate a single question
async function generateSingleQuestion(
    text: string, 
    model: ChatOpenAI
): Promise<Question | null> {
    const parser = new JsonOutputFunctionsParser();
    const questionSchema = {
        name: "createQuestion",
        description: "Creates a single quiz question from the provided text",
        parameters: {
            type: "object",
            properties: {
                question: {
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
            },
            required: ["question"]
        }
    };

    try {
        const prompt = `
            Create ONE quiz question based on the following text:

            ${text}

            Requirements:
            - The question should be clear and specific
            - Provide exactly 4 answer choices
            - Mark exactly one answer as correct
            - Base the question on factual information from the text
        `;

        const runnable = model
            .bind({
                functions: [questionSchema],
                function_call: { name: "createQuestion" },
            })
            .pipe(parser);

        const message = new HumanMessage({
            content: [{ type: "text", text: prompt }],
        });

        const result = await runnable.invoke([message]);
        
        if (result && 
            typeof result === 'object' && 
            'question' in result && 
            typeof result.question === 'object' &&
            result.question !== null) {
            return result.question as Question;
        }
        
        return null;
    } catch (error) {
        console.error("Error generating question:", error);
        return null;
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

        // Use faster model with shorter timeout
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo", // Use the base model instead of 16k
            temperature: 0.7,
            maxRetries: 2,
            timeout: 30000, // Much shorter timeout (30 seconds)
        });

        const textContent = Array.isArray(text) ? text.join("\n") : text;
        
        // Split the content into manageable chunks
        const chunks = splitTextIntoChunks(textContent);
        console.log(`🧩 Split content into ${chunks.length} chunks`);
        
        // Generate quiz metadata
        const metadataModel = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo",
            temperature: 0.7,
            timeout: 20000,
        });
        
        const metadataParser = new JsonOutputFunctionsParser();
        const metadataSchema = {
            name: "createMetadata",
            description: "Creates quiz metadata based on the content",
            parameters: {
                type: "object",
                properties: {
                    metadata: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                        },
                        required: ["name", "description"]
                    }
                },
                required: ["metadata"]
            }
        };
        
        const metadataRunnable = metadataModel
            .bind({
                functions: [metadataSchema],
                function_call: { name: "createMetadata" },
            })
            .pipe(metadataParser);
            
        console.log("🧠 Generating quiz metadata...");
        
        // Use the first chunk for metadata generation
        const metadataMessage = new HumanMessage({
            content: [{ 
                type: "text", 
                text: `Create a title and description for a quiz based on this content:\n\n${chunks[0]}` 
            }],
        });
        
        let quizName = "Content Quiz";
        let quizDescription = "A quiz based on the provided content.";
        
        try {
            const metadataResult = await metadataRunnable.invoke([metadataMessage]);
            if (metadataResult && 
                typeof metadataResult === 'object' && 
                'metadata' in metadataResult &&
                typeof metadataResult.metadata === 'object' &&
                metadataResult.metadata !== null) {
                
                const metadata = metadataResult.metadata as {name: string, description: string};
                quizName = metadata.name;
                quizDescription = metadata.description;
            }
        } catch (error) {
            console.warn("⚠️ Failed to generate metadata, using defaults", error);
        }
        
        // Generate questions in parallel with limited concurrency
        console.log("🧠 Generating questions...");
        const questionPromises: Promise<Question | null>[] = [];
        const questionLimit = Math.min(8, chunks.length); // Limit total questions
        
        // Take a random selection of chunks if there are too many
        let selectedChunks = chunks;
        if (chunks.length > questionLimit) {
            selectedChunks = [];
            const chunkIndices = new Set<number>();
            while (chunkIndices.size < questionLimit) {
                const randomIndex = Math.floor(Math.random() * chunks.length);
                chunkIndices.add(randomIndex);
            }
            selectedChunks = Array.from(chunkIndices).map(index => chunks[index]);
        }
        
        // Generate with limited concurrency to avoid rate limits
        const batchSize = 2; // Process 2 at a time
        const questions: Question[] = [];
        
        for (let i = 0; i < selectedChunks.length; i += batchSize) {
            const batch = selectedChunks.slice(i, i + batchSize);
            const batchPromises = batch.map(chunk => generateSingleQuestion(chunk, model));
            
            try {
                console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(selectedChunks.length/batchSize)}`);
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        questions.push(result.value);
                    }
                });
                
                // Small delay between batches to avoid rate limits
                if (i + batchSize < selectedChunks.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`Error in batch ${i/batchSize + 1}:`, error);
            }
        }
        
        if (questions.length === 0) {
            return NextResponse.json(
                { error: "Failed to generate any valid questions" },
                { status: 500 }
            );
        }
        
        // Create the final quiz object
        const quiz: Quiz = {
            name: quizName,
            description: quizDescription,
            questions: questions
        };
        
        try {
            console.log(`💾 Saving quiz with ${questions.length} questions to database...`);
            const { quizzId } = await saveQuizz(quiz);
            
            return NextResponse.json({ 
                quizzId,
                questionCount: questions.length,
                success: true
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
