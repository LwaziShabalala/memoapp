export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            console.warn("Request received without text input.");
            return NextResponse.json(
                { error: "Text input is required" },
                { status: 400 }
            );
        }

        const textContent = Array.isArray(text) ? text.join("\n") : text;
        console.log("Received text for quiz generation:", textContent);

        if (!process.env.OPENAI_API_KEY) {
            console.error("OpenAI API key not provided");
            return NextResponse.json(
                { error: "OpenAI API key not provided" },
                { status: 500 }
            );
        }

        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-3.5-turbo",
        });

        const parser = new JsonOutputFunctionsParser();
        const extractionFunctionSchema = {
            name: "extractor",
            description: "Extracts fields from output",
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
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };

        const runnable = model
            .bind({
                functions: [extractionFunctionSchema],
                function_call: { name: "extractor" },
            })
            .pipe(parser);

        const prompt =
            "Given the text which is a summary of the document, generate a quiz based on the text. Return JSON only that contains a quiz object with fields: name, description, and questions. The questions should be an array of objects with fields: questionText, answers. The answers should be an array of objects with fields: answerText, isCorrect.";

        const message = new HumanMessage({
            content: [
                {
                    type: "text",
                    text: `${prompt}\n${textContent}`,
                },
            ],
        });

        console.log("Sending message to OpenAI:", message);

        const result = await runnable.invoke([message]) as QuizResult;
        console.log("Raw OpenAI response:", result);

        if (!result || !result.quizz) {
            console.error("Quiz data missing in OpenAI response:", result);
            return NextResponse.json(
                { error: "Failed to generate quiz data", details: result },
                { status: 500 }
            );
        }

        console.log("Generated quiz:", result.quizz);

        const { quizzId } = await saveQuizz(result.quizz);
        console.log("Quiz saved with ID:", quizzId);

        return NextResponse.json(
            { quizzId },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("An error occurred:", error.message);
            console.error("Error stack trace:", error.stack);

            return NextResponse.json(
                { error: "Internal Server Error", details: error.message, stack: error.stack },
                { status: 500 }
            );
        }

        console.error("An unknown error occurred:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: "An unknown error occurred" },
            { status: 500 }
        );
    }
}
