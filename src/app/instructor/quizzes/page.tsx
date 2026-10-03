"use client";

import { Badge, Group, Stack, Table, Text } from "@mantine/core";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
import { Pagination, usePaginationParams } from "../../../components/pagination";
import { Alert, Button, Card, PageHeader } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { formatWhen } from "../../../lib/format";
import { fetchAllQuestions } from "../../../lib/questions";
import type { Page, Question, Quiz, QuizStatus } from "../../../lib/types";
import { emptyQuizForm, formFromQuiz, QuizEditorFields, quizPayload, type QuizFormState } from "./editor";

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

export default function QuizzesRoute() {
  return (
    <Suspense fallback={null}>
      <QuizzesPage />
    </Suspense>
  );
}

function QuizzesPage() {
  const { token } = useAuth();
  const { page, size, setPage } = usePaginationParams(5);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [bank, setBank] = useState<Question[]>([]);
  const [form, setForm] = useState<QuizFormState>(emptyQuizForm);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Quiz | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const editorOpen = creating || editing !== null;

  const fetchQuizzes = useCallback(
    (pageIndex: number) => api<Page<Quiz>>(`/api/quizzes?page=${pageIndex}&size=${size}`, {}, token),
    [token, size],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAllQuestions(token).then((questions) => {
      if (!cancelled) setBank(questions);
    }).catch((caught) => {
      if (!cancelled) setError(caught);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchQuizzes(page)
      .then((result) => {
        if (cancelled) return;
        if (result.totalPages > 0 && page > result.totalPages - 1) {
          setPage(result.totalPages - 1);
          return;
        }
        setQuizzes(result.content);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setLoaded(true);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught);
      });
    return () => {
      cancelled = true;
    };
  }, [token, page, size, reloadKey, fetchQuizzes]);

  function openCreate() {
    setForm(emptyQuizForm());
    setFormError(null);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(quiz: Quiz) {
    setForm(formFromQuiz(quiz));
    setFormError(null);
    setCreating(false);
    setEditing(quiz);
  }

  function closeEditor() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (editing) {
        await api(`/api/quizzes/${editing.id}`, { method: "PUT", body: JSON.stringify(quizPayload(form)) }, token);
      } else {
        await api("/api/quizzes", { method: "POST", body: JSON.stringify(quizPayload(form)) }, token);
      }
      closeEditor();
      if (!editing) setPage(0);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setFormError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/quizzes/${deleting.id}`, { method: "DELETE" }, token);
      setDeleting(null);
      setReloadKey((key) => key + 1);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Quizzes"
        description={!loaded ? "Loading…" : totalElements === 0 ? "No quizzes yet." : `${totalElements} quiz${totalElements === 1 ? "" : "zes"}`}
        action={<Button onClick={openCreate}>New quiz</Button>}
      />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {loaded && totalElements === 0 ? (
        <Card>
          <Text size="sm" c="dimmed">Create a draft to set the window, marks, and questions. Publish it from the quiz page once it is ready.</Text>
        </Card>
      ) : null}
      {quizzes.length > 0 ? (
        <Table.ScrollContainer minWidth={980}>
          <Table striped highlightOnHover withTableBorder bg="white" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Quiz</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Questions</Table.Th>
                <Table.Th>Marks</Table.Th>
                <Table.Th>Duration</Table.Th>
                <Table.Th>Window</Table.Th>
                <Table.Th>Assigned</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {quizzes.map((quiz) => {
                const assigned = quiz.assignments.map((assignment) => assignment.className || assignment.studentName).filter(Boolean);
                return (
                  <Table.Tr key={quiz.id}>
                    <Table.Td maw={280}>
                      <Text fw={600}>{quiz.title}</Text>
                      {quiz.instructions ? <Text size="xs" c="dimmed" lineClamp={2}>{quiz.instructions}</Text> : null}
                    </Table.Td>
                    <Table.Td><Badge variant="light" color={statusColor[quiz.status]}>{statusLabels[quiz.status]}</Badge></Table.Td>
                    <Table.Td>{quiz.questions.length}</Table.Td>
                    <Table.Td>{quiz.totalMarks}</Table.Td>
                    <Table.Td>{quiz.durationMinutes} min</Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatWhen(quiz.startTime)}</Text>
                      <Text size="xs" c="dimmed">{formatWhen(quiz.endTime)}</Text>
                    </Table.Td>
                    <Table.Td>{assigned.length === 0 ? "Not assigned" : assigned.join(", ")}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap" justify="flex-end">
                        {quiz.status === "DRAFT" ? <Button tone="ghost" onClick={() => openEdit(quiz)}>Edit</Button> : null}
                        <Button href={`/instructor/quizzes/${quiz.id}`}>Open</Button>
                        {quiz.status !== "DRAFT" ? <Button tone="ghost" href={`/instructor/analytics/${quiz.id}`}>Analytics</Button> : null}
                        <Button tone="danger" onClick={() => setDeleting(quiz)}>Delete</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : null}
      <Pagination page={page} size={size} total={totalElements} onPageChange={setPage} />
      <Modal
        width="lg"
        open={editorOpen}
        onOpenChange={(open) => { if (!open) closeEditor(); }}
        title={editing ? "Edit quiz" : "New quiz"}
        description={editing ? "Update the window, marks, and questions. Only a draft can be edited." : "Start a draft. You can publish it after the questions are in place."}
      >
        <form onSubmit={save}>
          <Stack gap="md">
            {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
            <QuizEditorFields form={form} setForm={setForm} bank={bank} />
            <Group justify="flex-end">
              <Button tone="ghost" onClick={closeEditor}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete quiz"
        description={deleting ? `${deleting.title} will be removed. A quiz that already has attempts cannot be deleted.` : undefined}
      >
        <Group justify="flex-end">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </Group>
      </Modal>
    </>
  );
}
