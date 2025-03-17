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
    
    try {
        console.log("📝 Starting to save quiz to database");
        console.log(`Quiz name: ${name}, Questions count: ${questions.length}`);
        
        const newQuizz = await db
            .insert(quizzez)
            .values({
                name,
                description
            } as Quizz)
            .returning({ insertId: quizzez.id });
        
        const quizzId = newQuizz[0].insertId;
        console.log(`✅ Created quiz with ID: ${quizzId}`);
        
        try {
            await db.transaction(async (tx) => {
                console.log(`🔄 Starting transaction to save ${questions.length} questions`);
                
                for (const [index, question] of questions.entries()) {
                    const questionData: Partial<Question> = {
                        questionText: question.questionText,
                        quizzId
                    };
                    
                    const [{ questionId }] = await tx
                        .insert(dbQuestions)
                        .values(questionData)
                        .returning({ questionId: dbQuestions.id });
                    
                    console.log(`✅ Added question ${index + 1} with ID: ${questionId}`);
                    
                    if (question.answers && question.answers.length > 0) {
                        const answerValues: Partial<Answer>[] = question.answers.map((answer) => ({
                            answerText: answer.answerText,
                            isCorrect: answer.isCorrect,
                            questionId
                        }));
                        
                        await tx.insert(questionAnswers).values(answerValues);
                        console.log(`✅ Added ${answerValues.length} answers for question ${index + 1}`);
                    } else {
                        console.warn(`⚠️ No answers for question ${index + 1}`);
                    }
                }
                
                console.log(`✅ Transaction completed successfully`);
            });
            
            console.log(`🎉 Successfully saved quiz with ID: ${quizzId}`);
            return { quizzId };
        } catch (txError) {
            console.error("❌ Transaction error:", txError);
            throw new Error(`Failed to save questions and answers: ${txError.message}`);
        }
    } catch (error) {
        console.error("❌ Database error:", error);
        throw new Error(`Failed to save quiz to database: ${error.message}`);
    }
}
