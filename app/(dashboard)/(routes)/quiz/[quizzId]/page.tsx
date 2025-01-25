import { db } from "@/app/db";
import { quizzez } from "@/app/db/schema";
import { eq } from 'drizzle-orm'
import QuizQuestions from "../QuizQuestions";

const Page = async ({ params }: {
    params: {
        quizzId: string
    }

}) => {
    const quizzId = params.quizzId
    const quizz = await db.query.quizzez.findFirst({
        where: eq(quizzez.id, parseInt(quizzId)),
        with: {
            questions: {
                with: {
                    answers: true
                }
            }
        }
    })
    console.log(quizz)

    if (!quizzId || !quizz || quizz.questions.length === 0) {
        return <div>Quizz not found</div>
    };

    return (
        <div><QuizQuestions quizz={quizz} /></div>
    )
}

export default Page