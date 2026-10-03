"use client";

import { Group, Stack, Text, Title } from "@mantine/core";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Card, PageHeader } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { ResultView } from "../../../../lib/types";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [result, setResult] = useState<ResultView | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!token) return;
    api<ResultView>(`/api/attempts/${id}/result`, {}, token).then(setResult).catch(setError);
  }, [token, id]);

  async function summarize() {
    setError(null);
    try {
      setResult(await api<ResultView>(`/api/attempts/${id}/ai-summary`, { method: "POST" }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  if (!result) return error ? <Alert>{errorMessage(error)}</Alert> : <Text size="sm" c="dimmed">Loading your result…</Text>;

  return (
    <>
      <PageHeader title={result.quizTitle} description="Your score and the marked paper." />
      <Card>
        <Title order={1}>{result.score ?? 0}<Text span c="dimmed" fz="0.45em"> / {result.maxScore ?? 0}</Text></Title>
        <Text size="sm" c="dimmed" mt="sm">
          {result.pendingReview ? "Objective questions are marked. Short answers are still with your instructor." : result.passed ? "You reached the passing mark." : "You did not reach the passing mark."}
        </Text>
        {result.status === "GRADED" ? <Group mt="md"><Button tone="ghost" onClick={summarize}>Write an AI summary</Button></Group> : null}
        {result.aiSummary ? <Text size="sm" mt="md" lh={1.6}>{result.aiSummary}</Text> : null}
      </Card>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Stack gap="md">
        {result.questions.map((question, index) => (
          <Card key={`${question.questionId}-${index}`}>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">
              {question.awardedMarks == null ? "Pending" : `${question.awardedMarks}/${question.marks}`}
              {question.gradeSource ? ` · ${question.gradeSource.toLowerCase()}` : ""}
            </Text>
            <Title order={4} mt={4}>{question.text}</Title>
            <Text size="sm" mt="sm"><Text span c="dimmed">Your answer. </Text>{question.yourAnswer}</Text>
            {question.correctAnswer ? <Text size="sm" mt={4}><Text span c="dimmed">Expected. </Text>{question.correctAnswer}</Text> : null}
            {question.feedback ? <Text size="sm" mt="xs" c="blue">{question.feedback}</Text> : null}
          </Card>
        ))}
      </Stack>
    </>
  );
}
