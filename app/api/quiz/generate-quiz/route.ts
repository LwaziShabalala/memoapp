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

export async function POST(req: NextRequest) {
    try {
        console.log("🔍 [DEBUG] Received request at /api/quiz/generate-quiz");

        // Parse and validate request body
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
        console.log("📥 Received text input length:", text?.length || 0);

        if (!text) {
            console.error("❌ Error: No text input provided.");
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        // Validate API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("❌ Error: OpenAI API key not found in environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }
        console.log("✅ OpenAI API Key is available");

        const textContent = Array.isArray(text) ? text.join("\n") : text;

        // Initialize OpenAI with error handling
        const model = new ChatOpenAI({
            apiKey,
            modelName: "gpt-3.5-turbo",
            temperature: 0.7,
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts quiz data from the provided text",
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
                                            minItems: 2,
                                            maxItems: 4
                                        }
                                    },
                                    required: ["questionText", "answers"]
                                },
                                minItems: 1
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

        // Updated prompt for truly dynamic question count
        const prompt = `
            Generate a quiz from the provided text. Return JSON with a quiz object containing name, description, and questions.
            
            IMPORTANT - NUMBER OF QUESTIONS:
            The number of questions MUST VARY based on the content length:
            - For short texts (1-2 paragraphs): Generate 2-3 questions
            - For medium texts (3-4 paragraphs): Generate 4-6 questions
            - For long texts (5+ paragraphs): Generate 7-10 questions
            
            DO NOT generate a fixed number of questions. The exact count should be determined by:
            1. Text length (follow the above guidelines)
            2. Number of distinct concepts in the text
            3. Complexity of the material
            4. Importance of different topics
            
            REQUIREMENTS FOR EACH QUESTION:
            1. Must have EXACTLY 4 answer options
            2. Only ONE answer can be correct
            3. Focus on testing understanding, not memorization
            4. Each question should cover a different concept
            5. No redundant questions
            
            The output structure should be:
            {
              "quizz": {
                "name": "Quiz Title",
                "description": "Brief description",
                "questions": [
                  {
                    "questionText": "Question here",
                    "answers": [
                      {"answerText": "Option 1", "isCorrect": true},
                      {"answerText": "Option 2", "isCorrect": false},
                      {"answerText": "Option 3", "isCorrect": false},
                      {"answerText": "Option 4", "isCorrect": false}
                    ]
                  }
                ]
              }
            }
            
            Remember: The number of questions MUST VARY based on content length - DO NOT use a fixed number!
        `;

        console.log("🧠 [DEBUG] Sending request to OpenAI...");
        let result: QuizResult;
        try {
            const message = new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: `${prompt}\n${textContent}`,
                    },
                ],
            });
            result = await runnable.invoke([message]) as QuizResult;
        } catch (error) {
            console.error("❌ OpenAI API Error:", error);
            return NextResponse.json(
                { error: "Failed to generate quiz content", details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }

        console.log("✅ OpenAI Response received");

        // Validate quiz structure
        if (!result?.quizz?.questions?.length) {
            console.error("❌ Error: Invalid quiz structure returned from OpenAI");
            return NextResponse.json(
                { error: "Invalid quiz structure generated" },
                { status: 500 }
            );
        }

        // Save to database with error handling
        try {
            console.log("📝 [DEBUG] Saving quiz to database...");
            const { quizzId } = await saveQuizz(result.quizz);
            console.log("✅ Quiz saved with ID:", quizzId);
            
            return NextResponse.json({ quizzId }, { status: 200 });
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
            { 
                error: "Internal Server Error", 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
