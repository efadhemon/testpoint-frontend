"use client";

import { Group, SimpleGrid, Stack, Text } from "@mantine/core";
import type { Dispatch, SetStateAction } from "react";
import { Area, Checkbox, Field, TextInput } from "../../../components/ui";
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
        <TextInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
      </Field>
      <Field label="Instructions">
        <Area rows={2} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} />
      </Field>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Field label="Minutes">
          <TextInput type="number" min={1} value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))} />
        </Field>
        <Field label="Passing marks">
          <TextInput type="number" min={0} value={form.passingMarks} onChange={(event) => setForm((current) => ({ ...current, passingMarks: Number(event.target.value) }))} />
        </Field>
        <Field label="Opens">
          <TextInput type="datetime-local" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} required />
        </Field>
        <Field label="Closes">
          <TextInput type="datetime-local" value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} required />
        </Field>
        <Field label="Attempts allowed">
          <TextInput type="number" min={1} value={form.maxAttempts} onChange={(event) => setForm((current) => ({ ...current, maxAttempts: Number(event.target.value) }))} />
        </Field>
        <Group align="center" gap="sm" h="100%">
          <Checkbox checked={form.shuffle} onCheckedChange={(checked) => setForm((current) => ({ ...current, shuffle: checked }))} />
          <Text size="sm">Shuffle question order</Text>
        </Group>
      </SimpleGrid>
      <Stack gap="xs">
        <Text size="sm" fw={500}>Questions</Text>
        {bank.length === 0 ? <Text size="sm" c="dimmed">Add questions to the bank first.</Text> : null}
        <Stack gap="xs" mah={220} style={{ overflowY: "auto" }}>
          {bank.map((question) => (
            <Group key={question.id} align="flex-start" wrap="nowrap" gap="sm">
              <Checkbox checked={form.questionIds.includes(question.id)} onCheckedChange={() => toggle(question.id)} />
              <Text size="sm"><Text span c="dimmed">{typeLabels[question.type]}</Text> · {question.text}</Text>
            </Group>
          ))}
        </Stack>
      </Stack>
    </>
  );
}
