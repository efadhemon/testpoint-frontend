"use client";

import { Badge, Group, List, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../../../../components/dialog";
import { Alert, Button, Card, PageHeader, SelectField } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import { formatWhen } from "../../../../lib/format";
import { fetchAllQuestions } from "../../../../lib/questions";
import type { ClassGroup, Question, Quiz, QuizStatus } from "../../../../lib/types";
import { emptyQuizForm, formFromQuiz, QuizEditorFields, quizPayload, type QuizFormState } from "../editor";

const statusLabels: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

const statusColor: Record<QuizStatus, string> = {
  DRAFT: "gray",
  PUBLISHED: "blue",
  CLOSED: "red",
};

export default function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [bank, setBank] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [form, setForm] = useState<QuizFormState>(emptyQuizForm);
  const [editing, setEditing] = useState(false);
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<Quiz>(`/api/quizzes/${id}`, {}, token),
      fetchAllQuestions(token),
      api<ClassGroup[]>("/api/classes", {}, token),
    ]).then(([nextQuiz, questions, groups]) => {
      setQuiz(nextQuiz);
      setBank(questions);
      setClasses(groups);
      setForm(formFromQuiz(nextQuiz));
    }).catch(setError);
  }, [token, id]);

  function openEdit() {
    if (!quiz) return;
    setForm(formFromQuiz(quiz));
    setFormError(null);
    setEditing(true);
  }

  function closeEdit() {
    if (quiz) setForm(formFromQuiz(quiz));
    setFormError(null);
    setEditing(false);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const next = await api<Quiz>(`/api/quizzes/${id}`, {
        method: "PUT",
        body: JSON.stringify(quizPayload(form)),
      }, token);
      setQuiz(next);
      setForm(formFromQuiz(next));
      setEditing(false);
    } catch (caught) {
      setFormError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setError(null);
    try {
      const next = await api<Quiz>(`/api/quizzes/${id}/publish`, { method: "POST" }, token);
      setQuiz(next);
      setForm(formFromQuiz(next));
    } catch (caught) {
      setError(caught);
    }
  }

  async function closeQuiz() {
    setError(null);
    try {
      const next = await api<Quiz>(`/api/quizzes/${id}/close`, { method: "POST" }, token);
      setQuiz(next);
      setForm(formFromQuiz(next));
    } catch (caught) {
      setError(caught);
    }
  }

  async function assign() {
    setError(null);
    try {
      const next = await api<Quiz>(`/api/quizzes/${id}/assign`, { method: "POST", body: JSON.stringify({ classId: Number(classId), studentIds: [] }) }, token);
      setQuiz(next);
    } catch (caught) {
      setError(caught);
    }
  }

  if (!quiz) return <Text size="sm" c="dimmed">Loading quiz…</Text>;
  const draft = quiz.status === "DRAFT";
  const questions = [...quiz.questions].sort((a, b) => a.position - b.position);

  return (
    <>
      <PageHeader
        title={quiz.title}
        description={quiz.instructions || `${quiz.totalMarks} marks`}
        action={draft ? <Button tone="ghost" onClick={openEdit}>Edit</Button> : <Badge variant="light" color={statusColor[quiz.status]}>{statusLabels[quiz.status]}</Badge>}
      />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <Group mb="md">
          <Badge variant="light" color={statusColor[quiz.status]}>{statusLabels[quiz.status]}</Badge>
          <Text size="sm" c="dimmed">{quiz.totalMarks} marks</Text>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          <Text size="sm">Opens <Text span fw={600}>{formatWhen(quiz.startTime)}</Text></Text>
          <Text size="sm">Closes <Text span fw={600}>{formatWhen(quiz.endTime)}</Text></Text>
          <Text size="sm">Minutes <Text span fw={600}>{quiz.durationMinutes}</Text></Text>
          <Text size="sm">Attempts <Text span fw={600}>{quiz.maxAttempts}</Text></Text>
          <Text size="sm">Passing marks <Text span fw={600}>{quiz.passingMarks}</Text></Text>
          <Text size="sm">Shuffle <Text span fw={600}>{quiz.shuffleQuestions ? "On" : "Off"}</Text></Text>
        </SimpleGrid>
        <Title order={4} mt="lg">Questions</Title>
        {questions.length === 0 ? <Text size="sm" c="dimmed" mt="sm">No questions yet.</Text> : (
          <Table mt="sm" verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Question</Table.Th>
                <Table.Th>Marks</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {questions.map((question, index) => (
                <Table.Tr key={question.questionId}>
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td>{question.text}</Table.Td>
                  <Table.Td>{question.marks}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {draft ? null : <Text size="sm" c="dimmed" mt="md">Published quizzes stay fixed. Close the window if you want to stop new attempts.</Text>}
      </Card>
      <Group>
        {draft ? <Button onClick={publish}>Publish</Button> : null}
        {quiz.status === "PUBLISHED" ? <Button tone="danger" onClick={closeQuiz}>Close quiz</Button> : null}
      </Group>
      {quiz.status === "PUBLISHED" ? (
        <Card>
          <Title order={4}>Assign</Title>
          <Group mt="md" align="flex-end">
            <SelectField
              value={classId}
              placeholder="Choose a class"
              onValueChange={setClassId}
              options={classes.map((classGroup) => ({ value: String(classGroup.id), label: classGroup.name }))}
            />
            <Button onClick={assign} disabled={!classId}>Assign</Button>
          </Group>
          <List mt="md" spacing="xs">
            {quiz.assignments.length === 0 ? <List.Item><Text size="sm" c="dimmed">Not assigned yet.</Text></List.Item> : quiz.assignments.map((assignment) => (
              <List.Item key={assignment.id}>{assignment.className || assignment.studentName} · {formatWhen(quiz.startTime)} to {formatWhen(quiz.endTime)}</List.Item>
            ))}
          </List>
        </Card>
      ) : null}
      <Modal
        width="lg"
        open={editing}
        onOpenChange={(open) => { if (!open) closeEdit(); }}
        title="Edit quiz"
        description="Update the window, marks, and questions."
      >
        <form onSubmit={save}>
          <Stack gap="md">
            {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
            <QuizEditorFields form={form} setForm={setForm} bank={bank} />
            <Group justify="flex-end">
              <Button tone="ghost" onClick={closeEdit}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
