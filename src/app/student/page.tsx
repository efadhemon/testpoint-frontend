"use client";

import { Badge, Group, Table, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field, PageHeader, TextInput } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatWhen } from "../../lib/format";
import type { ClassGroup, StudentQuiz } from "../../lib/types";

const windowColor: Record<StudentQuiz["windowState"], string> = {
  UPCOMING: "gray",
  OPEN: "blue",
  CLOSED: "red",
};

export default function StudentHome() {
  const { token } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<unknown>(null);

  const fetchDesk = useCallback(
    () => Promise.all([
      api<StudentQuiz[]>("/api/student/quizzes", {}, token),
      api<ClassGroup[]>("/api/classes", {}, token),
    ]),
    [token],
  );

  async function load() {
    const [papers, groups] = await fetchDesk();
    setQuizzes(papers);
    setClasses(groups);
  }

  useEffect(() => {
    if (!token) return;
    fetchDesk().then(([papers, groups]) => {
      setQuizzes(papers);
      setClasses(groups);
    }).catch(setError);
  }, [token, fetchDesk]);

  async function join(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api("/api/classes/join", { method: "POST", body: JSON.stringify({ code }) }, token);
      setCode("");
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function start(quiz: StudentQuiz) {
    setError(null);
    try {
      if (quiz.inProgressAttemptId) {
        router.push(`/student/attempt/${quiz.inProgressAttemptId}`);
        return;
      }
      const started = await api<{ attemptId: number }>(`/api/student/quizzes/${quiz.id}/start`, { method: "POST" }, token);
      router.push(`/student/attempt/${started.attemptId}`);
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <PageHeader title="Quizzes" description={classes.length === 0 ? "You are not in a class yet." : classes.map((item) => item.name).join(", ")} />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={join}>
          <Group align="flex-end">
            <Field label="Join a class">
              <TextInput value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Join code" required />
            </Field>
            <Button type="submit">Join</Button>
          </Group>
        </form>
      </Card>
      {quizzes.length === 0 ? <Text c="dimmed">No quiz is assigned yet.</Text> : (
        <Table.ScrollContainer minWidth={760}>
          <Table striped highlightOnHover withTableBorder bg="white" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Quiz</Table.Th>
                <Table.Th>Window</Table.Th>
                <Table.Th>Schedule</Table.Th>
                <Table.Th>Attempts</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {quizzes.map((quiz) => (
                <Table.Tr key={quiz.id}>
                  <Table.Td maw={320}>
                    <Text fw={600}>{quiz.title}</Text>
                    {quiz.instructions ? <Text size="xs" c="dimmed" lineClamp={2}>{quiz.instructions}</Text> : null}
                  </Table.Td>
                  <Table.Td><Badge variant="light" color={windowColor[quiz.windowState]}>{quiz.windowState}</Badge></Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatWhen(quiz.startTime)}</Text>
                    <Text size="xs" c="dimmed">{formatWhen(quiz.endTime)} · {quiz.durationMinutes} min</Text>
                  </Table.Td>
                  <Table.Td>{quiz.attemptsUsed}/{quiz.maxAttempts}</Table.Td>
                  <Table.Td>
                    {quiz.windowState === "OPEN" && (quiz.inProgressAttemptId || quiz.attemptsUsed < quiz.maxAttempts) ? (
                      <Button onClick={() => start(quiz)}>{quiz.inProgressAttemptId ? "Continue" : "Start"}</Button>
                    ) : (
                      <Text size="sm" c="dimmed">{quiz.windowState === "UPCOMING" ? "Not open yet" : "No attempts left"}</Text>
                    )}
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
