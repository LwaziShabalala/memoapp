import { db } from "@/app/db";
import { quizzez, questions as dbQuestions, questionAnswers } from "@/app/db/schema"
import { InferInsertModel } from "drizzle-orm";

type Quizz = InferInsertModel<typeof quizzez>;
type Question = InferInsertModel<typeof dbQuestions>;
type Answer = InferInsertModel<typeof questionAnswers>;

interface SaveQuizzData {
    name: string;
    description: string;
    questions: Array<{
        questionText: string;
        answers: Array<{
            answerText: string;
            isCorrect: boolean;
        }>;
    }>;
}

export default async function saveQuizz(quizzData: SaveQuizzData): Promise<{ quizzId: Quizz['id'] }> {
    const { name, description, questions } = quizzData;
    
    const newQuizz = await db
        .insert(quizzez)
        .values({
            name,
            description
        } as Quizz)
        .returning({ insertId: quizzez.id });
    
    const quizzId = newQuizz[0].insertId;
    
    await db.transaction(async (tx) => {
        for (const question of questions) {
            const questionData: Partial<Question> = {
                questionText: question.questionText,
                quizzId
            };
            
            const [{ questionId }] = await tx
                .insert(dbQuestions)
                .values(questionData)
                .returning({ questionId: dbQuestions.id });
            
            if (question.answers && question.answers.length > 0) {
                const answerValues: Partial<Answer>[] = question.answers.map((answer) => ({
                    answerText: answer.answerText,
                    isCorrect: answer.isCorrect,
                    questionId
                }));
                
                await tx.insert(questionAnswers).values(answerValues);
            }
        }
    });
    
    return { quizzId };
}
