"use client";

import type { Dispatch, SetStateAction } from "react";
import { Field, inputClass } from "../../../components/ui";
import { fromLocalInput, toLocalInput } from "../../../lib/format";
import type { Question, QuestionType, Quiz } from "../../../lib/types";

const typeLabels: Record<QuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
};

export type QuizFormState = {
  title: string;
  instructions: string;
  duration: number;
  passingMarks: number;
  start: string;
  end: string;
  maxAttempts: number;
  shuffle: boolean;
  questionIds: number[];
};

export function emptyQuizForm(): QuizFormState {
  return {
    title: "",
    instructions: "",
    duration: 20,
    passingMarks: 1,
    start: toLocalInput(new Date().toISOString()),
    end: toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()),
    maxAttempts: 1,
    shuffle: true,
    questionIds: [],
  };
}

export function formFromQuiz(quiz: Quiz): QuizFormState {
  return {
    title: quiz.title,
    instructions: quiz.instructions || "",
    duration: quiz.durationMinutes,
    passingMarks: quiz.passingMarks,
    start: toLocalInput(quiz.startTime),
    end: toLocalInput(quiz.endTime),
    maxAttempts: quiz.maxAttempts,
    shuffle: quiz.shuffleQuestions,
    questionIds: [...quiz.questions].sort((a, b) => a.position - b.position).map((question) => question.questionId),
  };
}

export function quizPayload(form: QuizFormState) {
  return {
    title: form.title,
    instructions: form.instructions,
    durationMinutes: form.duration,
    startTime: fromLocalInput(form.start),
    endTime: fromLocalInput(form.end),
    shuffleQuestions: form.shuffle,
    maxAttempts: form.maxAttempts,
    passingMarks: form.passingMarks,
    questionIds: form.questionIds,
  };
}

export function QuizEditorFields({
  form,
  setForm,
  bank,
}: {
  form: QuizFormState;
  setForm: Dispatch<SetStateAction<QuizFormState>>;
  bank: Question[];
}) {
  function toggle(questionId: number) {
    setForm((current) => ({
      ...current,
      questionIds: current.questionIds.includes(questionId)
        ? current.questionIds.filter((item) => item !== questionId)
        : [...current.questionIds, questionId],
    }));
  }

  return (
    <>
      <Field label="Title">
        <input className={inputClass()} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
      </Field>
      <Field label="Instructions">
        <textarea className={inputClass()} rows={2} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Minutes">
          <input className={inputClass()} type="number" min={1} value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))} />
        </Field>
        <Field label="Passing marks">
          <input className={inputClass()} type="number" min={0} value={form.passingMarks} onChange={(event) => setForm((current) => ({ ...current, passingMarks: Number(event.target.value) }))} />
        </Field>
        <Field label="Opens">
          <input className={inputClass()} type="datetime-local" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} required />
        </Field>
        <Field label="Closes">
          <input className={inputClass()} type="datetime-local" value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} required />
        </Field>
        <Field label="Attempts allowed">
          <input className={inputClass()} type="number" min={1} value={form.maxAttempts} onChange={(event) => setForm((current) => ({ ...current, maxAttempts: Number(event.target.value) }))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.shuffle} onChange={(event) => setForm((current) => ({ ...current, shuffle: event.target.checked }))} />
          Shuffle question order
        </label>
      </div>
      <div>
        <p className="text-sm font-medium text-ink/80">Questions</p>
        {bank.length === 0 ? <p className="mt-2 text-sm text-ink/60">Add questions to the bank first.</p> : null}
        <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto">
          {bank.map((question) => (
            <li key={question.id}>
              <label className="flex gap-3 text-sm">
                <input type="checkbox" checked={form.questionIds.includes(question.id)} onChange={() => toggle(question.id)} />
                <span><span className="text-ink/50">{typeLabels[question.type]}</span> · {question.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
