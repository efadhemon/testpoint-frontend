"use client";

import { Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field, PageHeader, TextInput } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { PendingAnswer } from "../../../lib/types";

export default function GradingPage() {
  const { token } = useAuth();
  const [pending, setPending] = useState<PendingAnswer[]>([]);
  const [ready, setReady] = useState(false);
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [error, setError] = useState<unknown>(null);

  const fetchPending = useCallback(
    () => api<PendingAnswer[]>("/api/grading/pending", {}, token),
    [token],
  );

  const applyPending = useCallback((rows: PendingAnswer[]) => {
    setPending(rows);
    setMarks(Object.fromEntries(rows.map((row) => [row.answerId, row.marks])));
    setReady(true);
  }, []);

  async function load() {
    applyPending(await fetchPending());
  }

  useEffect(() => {
    if (!token) return;
    fetchPending().then(applyPending).catch((caught) => {
      setError(caught);
      setReady(true);
    });
  }, [token, fetchPending, applyPending]);

  async function grade(answerId: number) {
    setError(null);
    try {
      await api(`/api/grading/answers/${answerId}`, {
        method: "POST",
        body: JSON.stringify({ awardedMarks: marks[answerId] ?? 0, feedback: feedback[answerId] || "" }),
      }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function gradeAi(attemptId: number) {
    setError(null);
    try {
      await api(`/api/grading/attempts/${attemptId}/ai`, { method: "POST" }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  const attempts = [...new Set(pending.map((row) => row.attemptId))];

  return (
    <>
      <PageHeader title="Short answers" description="Review written answers and save a mark." />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {ready && pending.length === 0 ? <Text c="dimmed">Nothing is waiting for a mark.</Text> : null}
      {attempts.map((attemptId) => (
        <Stack key={attemptId} gap="sm">
          <Group>
            <Button tone="ghost" onClick={() => gradeAi(attemptId)}>Suggest marks with AI</Button>
          </Group>
          {pending.filter((row) => row.attemptId === attemptId).map((row) => (
            <Card key={row.answerId}>
              <Text size="xs" tt="uppercase" fw={600} c="dimmed">{row.quizTitle} · {row.studentName}</Text>
              <Title order={4} mt={4}>{row.questionText}</Title>
              <Text size="sm" mt="sm"><Text span c="dimmed">Rubric. </Text>{row.modelAnswer}</Text>
              <Text size="sm" mt={4}><Text span c="dimmed">Answer. </Text>{row.textAnswer || "No answer"}</Text>
              <SimpleGrid mt="md" cols={{ base: 1, md: 3 }} style={{ alignItems: "end" }}>
                <Field label={`Marks out of ${row.marks}`}>
                  <TextInput type="number" min={0} max={row.marks} value={marks[row.answerId] ?? 0} onChange={(event) => setMarks((current) => ({ ...current, [row.answerId]: Number(event.target.value) }))} />
                </Field>
                <Field label="Feedback">
                  <TextInput value={feedback[row.answerId] || ""} onChange={(event) => setFeedback((current) => ({ ...current, [row.answerId]: event.target.value }))} />
                </Field>
                <Group align="flex-end" h="100%"><Button onClick={() => grade(row.answerId)}>Save mark</Button></Group>
              </SimpleGrid>
            </Card>
          ))}
        </Stack>
      ))}
    </>
  );
}
