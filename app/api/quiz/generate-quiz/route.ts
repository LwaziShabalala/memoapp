import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "langchain/schema";


export async function POST(req) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Invalid input text" }, { status: 400 });
        }

        console.log("📩 Request payload:", JSON.stringify({ text }, null, 2));

        const model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo-1106",
            temperature: 0,
            maxRetries: 2,
            timeout: 60000,
        });

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a quiz generator. Generate a quiz based on the given text."],
            ["human", "{input}"],
        ]);

        const runnable = RunnableSequence.from([
            prompt,
            model,
            new JsonOutputFunctionsParser(),
        ]);

        let result;
        try {
            result = await runnable.invoke({ input: text });

            console.log("📝 Raw response:", JSON.stringify(result, null, 2));

            if (!result || typeof result !== "object") {
                throw new Error("Invalid JSON response from OpenAI");
            }
        } catch (error) {
            console.error("❌ OpenAI API error:", error);
            return NextResponse.json(
                { error: "Failed to generate quiz content", details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ quiz: result }, { status: 200 });
    } catch (error) {
        console.error("❌ Server error:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
