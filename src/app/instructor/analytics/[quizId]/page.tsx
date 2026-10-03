"use client";

import { Group, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, PageHeader, Stat } from "../../../../components/ui";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import { percent } from "../../../../lib/format";
import type { QuizAnalytics } from "../../../../lib/types";

export default function AnalyticsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { token } = useAuth();
  const [report, setReport] = useState<QuizAnalytics | null>(null);

  useEffect(() => {
    if (!token) return;
    api<QuizAnalytics>(`/api/analytics/quizzes/${quizId}`, {}, token).then(setReport).catch(() => setReport(null));
  }, [token, quizId]);

  if (!report) return <Text size="sm" c="dimmed">Loading the report…</Text>;

  return (
    <>
      <PageHeader title={report.title} description="How this quiz was answered." />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Stat label="Submitted attempts" value={report.attemptCount} />
        <Stat label="Average" value={percent(report.averagePercent)} />
        <Stat label="Pass rate" value={percent(report.passRate)} />
      </SimpleGrid>
      <Card>
        <Text fw={600} mb="md">Question accuracy</Text>
        <Stack gap="md">
          {report.questions.map((question) => (
            <Stack key={question.questionId} gap={6}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text size="sm">{question.text}</Text>
                <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>{percent(question.accuracyPercent)} · {question.responses}</Text>
              </Group>
              <Progress value={Math.min(100, question.accuracyPercent)} size="sm" />
            </Stack>
          ))}
        </Stack>
      </Card>
    </>
  );
}
