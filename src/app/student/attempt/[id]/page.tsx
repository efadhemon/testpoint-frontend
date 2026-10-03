"use client";

import { Group, Paper, Text, Title } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Area, Button, Card, ChoiceGroup } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { TakeQuestion, TakeView } from "../../../../lib/types";

type AnswerState = { optionId: number | null; booleanAnswer: boolean | null; textAnswer: string | null };

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<TakeView | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [error, setError] = useState<unknown>(null);
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const hydrated = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!token) return;
    api<TakeView>(`/api/attempts/${id}`, {}, token)
      .then((loaded) => {
        setView(loaded);
        setOffset(new Date(loaded.serverNow).getTime() - Date.now());
        setAnswers(Object.fromEntries(loaded.questions.map((question) => [question.id, {
          optionId: question.answer.optionId,
          booleanAnswer: question.answer.booleanAnswer,
          textAnswer: question.answer.textAnswer,
        }])));
        hydrated.current = false;
      })
      .catch((caught) => {
        if (errorMessage(caught).includes("already submitted")) router.replace(`/student/results/${id}`);
        else setError(caught);
      });
  }, [token, id, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!view) return 0;
    return new Date(view.expiresAt).getTime() - (now + offset);
  }, [view, now, offset]);

  useEffect(() => {
    if (!view || remaining > 0) return;
    submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0 && view != null]);

  function currentPayload() {
    return {
      answers: Object.entries(answersRef.current).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        optionId: answer.optionId,
        booleanAnswer: answer.booleanAnswer,
        textAnswer: answer.textAnswer,
      })),
    };
  }

  useEffect(() => {
    if (!view || !token) return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ submitted: boolean }>(`/api/attempts/${id}/answers`, {
        method: "PUT",
        body: JSON.stringify(currentPayload()),
      }, token).then((response) => {
        if (response.submitted) router.replace(`/student/results/${id}`);
      }).catch((caught) => setError(caught));
    }, 500);
    return () => window.clearTimeout(handle);
  }, [answers, token, view, id, router]);

  async function submit(auto = false) {
    try {
      await api(`/api/attempts/${id}/submit`, { method: "POST", body: JSON.stringify(currentPayload()) }, token);
      router.replace(`/student/results/${id}`);
    } catch (caught) {
      if (!auto) setError(caught);
    }
  }

  if (!view) return error ? <Alert>{errorMessage(error)}</Alert> : <Text size="sm" c="dimmed">Loading the paper…</Text>;
  const minutes = Math.max(0, Math.floor(remaining / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));

  return (
    <>
      <Paper withBorder p="sm" radius="md" bg="white" style={{ position: "sticky", top: 0, zIndex: 5 }}>
        <Group justify="space-between">
          <Title order={3}>{view.quizTitle}</Title>
          <Text fw={700} c={remaining < 60000 ? "red" : "blue"}>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</Text>
        </Group>
      </Paper>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {view.questions.map((question, index) => (
        <QuestionCard key={question.id} index={index} question={question} answer={answers[question.id]} onChange={(next) => setAnswers((current) => ({ ...current, [question.id]: next }))} />
      ))}
      <Group><Button onClick={() => submit(false)}>Submit</Button></Group>
    </>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: TakeQuestion;
  answer: AnswerState;
  onChange: (answer: AnswerState) => void;
}) {
  return (
    <Card>
      <Text size="xs" tt="uppercase" fw={600} c="dimmed">Question {index + 1} · {question.marks} {question.marks === 1 ? "mark" : "marks"}</Text>
      <Title order={4} mt={4}>{question.text}</Title>
      {question.type === "MCQ" ? (
        <ChoiceGroup
          value={answer?.optionId == null ? "" : String(answer.optionId)}
          onValueChange={(value) => onChange({ optionId: Number(value), booleanAnswer: null, textAnswer: null })}
          options={question.options.map((option) => ({ value: String(option.id), label: option.text }))}
        />
      ) : null}
      {question.type === "TRUE_FALSE" ? (
        <ChoiceGroup
          value={answer?.booleanAnswer == null ? "" : String(answer.booleanAnswer)}
          onValueChange={(value) => onChange({ optionId: null, booleanAnswer: value === "true", textAnswer: null })}
          options={[{ value: "true", label: "True" }, { value: "false", label: "False" }]}
        />
      ) : null}
      {question.type === "SHORT_ANSWER" ? (
        <Area mt="sm" rows={4} value={answer?.textAnswer || ""} onChange={(event) => onChange({ optionId: null, booleanAnswer: null, textAnswer: event.target.value })} />
      ) : null}
    </Card>
  );
}
