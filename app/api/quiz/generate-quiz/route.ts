import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import saveQuizz from "./saveToDb";

interface QuizResult {
    quizz: {
        name: string;
        description: string;
        questions: {
            questionText: string;
            answers: {
                answerText: string;
                isCorrect: boolean;
            }[];
        }[];
    };
}

// Helper function to chunk text by sections
function chunkTextBySection(text: string): string[] {
    // Split by "QUESTION" marker and filter out empty chunks
    return text.split(/QUESTION \d+/).filter(chunk => chunk.trim().length > 0);
}

// Helper function to merge quiz results
function mergeQuizResults(results: QuizResult[]): QuizResult {
    return {
        quizz: {
            name: results[0].quizz.name,
            description: "Comprehensive assessment covering multiple topics",
            questions: results.flatMap(result => result.quizz.questions)
        }
    };
}

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");

        let body;
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
            console.error("❌ Error: No text input provided.");
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Error: OpenAI API key not found");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo-16k",
            temperature: 0.8,
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts quiz questions from the provided text section",
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
            Generate EXACTLY 3-4 questions from this section of text. 
            
            Requirements for EACH section:
            1. Create detailed, specific questions that test deep understanding
            2. Include technical details and terminology from the text
            3. Mix both factual and conceptual questions
            4. Ensure questions are non-overlapping and test different concepts
            5. Make answers specific and unambiguous
            
            IMPORTANT:
            - You MUST generate at least 3 questions for this section
            - Each question MUST have exactly 4 answer choices
            - Only ONE answer should be correct
            - All answers should be plausible but clearly distinguishable
            - Questions should require actual understanding, not just memorization
        `;

        // Split the content into sections and process each separately
        const textContent = Array.isArray(text) ? text.join("\n") : text;
        const sections = chunkTextBySection(textContent);
        console.log(`📑 Processing ${sections.length} sections`);

        const quizResults: QuizResult[] = [];
        
        // Process each section
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            console.log(`🔄 Processing section ${i + 1}/${sections.length}`);

            const sectionPrompt = `
                ${basePrompt}
                
                SECTION ${i + 1}/${sections.length}:
                ${section}
            `;

            try {
                const message = new HumanMessage({
                    content: [{ type: "text", text: sectionPrompt }],
                });
                const result = await runnable.invoke([message]) as QuizResult;
                if (result?.quizz?.questions?.length >= 3) {
                    quizResults.push(result);
                }
            } catch (error) {
                console.error(`❌ Error processing section ${i + 1}:`, error);
                // Continue with other sections even if one fails
                continue;
            }
        }

        if (quizResults.length === 0) {
            return NextResponse.json(
                { error: "Failed to generate valid questions" },
                { status: 500 }
            );
        }

        // Merge all results
        const finalResult = mergeQuizResults(quizResults);
        
        console.log(`✅ Generated ${finalResult.quizz.questions.length} total questions`);

        try {
            const { quizzId } = await saveQuizz(finalResult.quizz);
            return NextResponse.json({ 
                quizzId,
                questionCount: finalResult.quizz.questions.length
            }, { status: 200 });
        } catch (error) {
            console.error("❌ Database Error:", error);
            return NextResponse.json(
                { error: "Failed to save quiz", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Unexpected Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
