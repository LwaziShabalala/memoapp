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

export const maxDuration = 120;

function validateQuizResult(result: unknown): result is QuizResult {
    try {
        if (!result || typeof result !== 'object') return false;
        const quiz = (result as QuizResult).quizz;
        if (!quiz || typeof quiz !== 'object') return false;
        if (typeof quiz.name !== 'string' || typeof quiz.description !== 'string') return false;
        if (!Array.isArray(quiz.questions)) return false;
        
        for (const question of quiz.questions) {
            if (typeof question.questionText !== 'string' || !Array.isArray(question.answers)) return false;
            if (question.answers.length !== 4) return false;
            if (question.answers.filter(a => a.isCorrect).length !== 1) return false;
            for (const answer of question.answers) {
                if (typeof answer.answerText !== 'string' || typeof answer.isCorrect !== 'boolean') return false;
            }
        }
        return true;
    } catch {
        return false;
    }
}

function chunkText(text: string, maxChunkSize = 3000): string[] {
    const chunks: string[] = [];
    if (text.length <= maxChunkSize) return [text];
    
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
        if (paragraph.length > maxChunkSize) {
            chunks.push(...paragraph.match(new RegExp(`.{1,${maxChunkSize}}`, 'g'))!);
        } else if (currentChunk.length + paragraph.length > maxChunkSize) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

async function processChunkWithTimeout(chunk: string, model: ChatOpenAI, runnable: Runnable<unknown, unknown>, prompt: string): Promise<QuizResult | null> {
    return new Promise(async (resolve) => {
        const timeoutId = setTimeout(() => resolve(null), 50000);
        try {
            const message = new HumanMessage({ content: [{ type: "text", text: `${prompt}\n\n${chunk}` }] });
            const result = await runnable.invoke([message]);
            clearTimeout(timeoutId);
            resolve(validateQuizResult(result) ? result as QuizResult : null);
        } catch {
            clearTimeout(timeoutId);
            resolve(null);
        }
    });
}

function mergeQuizResults(results: QuizResult[]): QuizResult {
    return results.length > 0 ? { quizz: { ...results[0].quizz, questions: results.flatMap(r => r.quizz.questions) } } : { quizz: { name: "Fallback Quiz", description: "", questions: [] } };
}

function createFallbackQuiz(textInput: string): Quiz {
    return {
        name: "Quiz on " + textInput.slice(0, 50),
        description: "A basic quiz from the content",
        questions: [{ questionText: "What is the topic?", answers: [{ answerText: "Review content", isCorrect: true }, { answerText: "Not discussed", isCorrect: false }, { answerText: "Unclear", isCorrect: false }, { answerText: "None", isCorrect: false }] }]
    };
}

async function generateQuiz(textInput: string, apiKey: string) {
    const modelName = textInput.length < 10000 ? "gpt-4-turbo" : "gpt-3.5-turbo-16k";
    const model = new ChatOpenAI({ apiKey, modelName, temperature: 0.7, maxRetries: 3, timeout: 60000 });
    const parser = new JsonOutputFunctionsParser();
    
    const chunks = chunkText(textInput);
    const runnable = model.pipe(parser);
    
    const quizResults = await Promise.all(chunks.map(chunk => processChunkWithTimeout(chunk, model, runnable, "Generate a quiz")));
    
    return mergeQuizResults(quizResults.filter(r => r != null) as QuizResult[]);
}
