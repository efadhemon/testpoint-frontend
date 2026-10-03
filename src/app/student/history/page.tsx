"use client";

import { Badge, SimpleGrid, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Button, PageHeader, Stat } from "../../../components/ui";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { formatWhen, percent } from "../../../lib/format";
import type { AttemptStatus, StudentAnalytics } from "../../../lib/types";

const statusColor: Record<AttemptStatus, string> = {
  IN_PROGRESS: "yellow",
  SUBMITTED: "blue",
  GRADED: "green",
};

export default function HistoryPage() {
  const { token } = useAuth();
  const [report, setReport] = useState<StudentAnalytics | null>(null);

  useEffect(() => {
    if (!token) return;
    api<StudentAnalytics>("/api/analytics/me", {}, token).then(setReport).catch(() => setReport(null));
  }, [token]);

  const history = report?.history ?? [];

  return (
    <>
      <PageHeader title="History" description="Finished attempts and scores." />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Stat label="Finished attempts" value={report?.attemptCount ?? "—"} />
        <Stat label="Average" value={percent(report?.averagePercent)} />
      </SimpleGrid>
      {history.length === 0 ? <Text c="dimmed">No attempts yet.</Text> : (
        <Table.ScrollContainer minWidth={720}>
          <Table striped highlightOnHover withTableBorder bg="white">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Quiz</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Score</Table.Th>
                <Table.Th>Submitted</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((item) => (
                <Table.Tr key={item.attemptId}>
                  <Table.Td>{item.quizTitle}</Table.Td>
                  <Table.Td><Badge variant="light" color={statusColor[item.status]}>{item.status.replaceAll("_", " ")}</Badge></Table.Td>
                  <Table.Td>{item.score ?? "—"}/{item.maxScore ?? "—"}</Table.Td>
                  <Table.Td>{formatWhen(item.submittedAt)}</Table.Td>
                  <Table.Td>
                    {item.status !== "IN_PROGRESS"
                      ? <Button tone="ghost" href={`/student/results/${item.attemptId}`}>Result</Button>
                      : <Button href={`/student/attempt/${item.attemptId}`}>Continue</Button>}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
