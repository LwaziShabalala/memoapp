import {
    pgTable,
    text,
    integer,
    serial,
    boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const quizzez = pgTable("quizzez", {
    id: serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    userId: text("user_id"),
});

export const quizzezRelations = relations(quizzez, ({ many }) => ({
    questions: many(questions),
}));

export const questions = pgTable("questions", {
    id: serial("id").primaryKey(),
    questionText: text("question_text"),
    quizzId: integer("quizz_id"),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
    quizz: one(quizzez, {
        fields: [questions.quizzId],
        references: [quizzez.id],
    }),
    answers: many(questionAnswers),
}));

export const questionAnswers = pgTable("answers", {
    id: serial("id").primaryKey(),
    questionId: integer("question_id"),
    answerText: text("answer_text"),
    isCorrect: boolean("isCorrect"),
});

export const questionAnswersRelations = relations(questionAnswers, ({ one }) => ({
    question: one(questions, {
        fields: [questionAnswers.questionId],
        references: [questions.id],
    }),
}));
