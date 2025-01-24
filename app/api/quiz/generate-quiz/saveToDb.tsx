import { db } from "@/app/db";
import { quizzez, questions as dbQuestions, questionAnswers } from "@/app/db/schema"
import { InferInsertModel } from "drizzle-orm";

type Quizz = InferInsertModel<typeof quizzez>;
type Question = InferInsertModel<typeof dbQuestions>;
type Answer = InferInsertModel<typeof questionAnswers>;

interface SaveQuizzData extends Quizz {
    questions: Array<Question & { answers?: Answer[] }>;
}

export default async function saveQuizz(quizzData: SaveQuizzData) {
    const { name, description, questions } = quizzData;

    const newQuizz = await db
        .insert(quizzez)
        .values({
            name,
            description
        })
        .returning({ insertId: quizzez.id });
    const quizzId = newQuizz[0].insertId;

    await db.transaction(async (tx) => {
        for (const question of questions) {
            const [{ questionId }] = await tx
                .insert(dbQuestions)
                .values({
                    questionText: question.questionText,
                    quizzId
                })
                .returning({ questionId: dbQuestions.id })

            if (question.answers && question.answers.length > 0) {
                await tx.insert(questionAnswers).values(
                    question.answers.map((answer) => ({
                        answerText: answer.answerText,
                        isCorrect: answer.isCorrect,
                        questionId
                    }))
                )
            }
        }
    })
    return { quizzId }
}
