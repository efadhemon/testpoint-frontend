"use client";

import { Badge, Group, Radio, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
import { Pagination, usePaginationParams } from "../../../components/pagination";
import { Alert, Area, Button, Card, Field, PageHeader, SelectField, TextInput } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Option, Page, Question, QuestionType } from "../../../lib/types";

const typeLabels: Record<QuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
};

type FormState = {
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string;
  modelAnswer: string;
  correctBoolean: boolean;
  options: Option[];
};

const emptyOption = (): Option => ({ text: "", correct: false });

function emptyForm(): FormState {
  return {
    type: "MCQ",
    text: "",
    marks: 1,
    explanation: "",
    modelAnswer: "",
    correctBoolean: true,
    options: [emptyOption(), emptyOption()],
  };
}

function formFromQuestion(question: Question): FormState {
  return {
    type: question.type,
    text: question.text,
    marks: question.marks,
    explanation: question.explanation ?? "",
    modelAnswer: question.modelAnswer ?? "",
    correctBoolean: question.correctBoolean ?? true,
    options: question.options.length >= 2
      ? question.options.map((option) => ({ text: option.text, correct: option.correct }))
      : [emptyOption(), emptyOption()],
  };
}

function payload(form: FormState) {
  return {
    type: form.type,
    text: form.text,
    marks: form.marks,
    explanation: form.explanation || null,
    modelAnswer: form.type === "SHORT_ANSWER" ? form.modelAnswer : null,
    correctBoolean: form.type === "TRUE_FALSE" ? form.correctBoolean : null,
    options: form.type === "MCQ" ? form.options : [],
  };
}

export default function QuestionsRoute() {
  return (
    <Suspense fallback={null}>
      <QuestionsPage />
    </Suspense>
  );
}

function QuestionsPage() {
  const { token } = useAuth();
  const { page, size, setPage } = usePaginationParams(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const editorOpen = creating || editing !== null;

  const fetchQuestions = useCallback(
    (pageIndex: number) => api<Page<Question>>(`/api/questions?page=${pageIndex}&size=${size}`, {}, token),
    [token, size],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchQuestions(page)
      .then((result) => {
        if (cancelled) return;
        if (result.totalPages > 0 && page > result.totalPages - 1) {
          setPage(result.totalPages - 1);
          return;
        }
        setQuestions(result.content);
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
  }, [token, page, size, reloadKey, fetchQuestions]);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(question: Question) {
    setForm(formFromQuestion(question));
    setFormError(null);
    setCreating(false);
    setEditing(question);
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
        await api(`/api/questions/${editing.id}`, { method: "PUT", body: JSON.stringify(payload(form)) }, token);
      } else {
        await api("/api/questions", { method: "POST", body: JSON.stringify(payload(form)) }, token);
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
      await api(`/api/questions/${deleting.id}`, { method: "DELETE" }, token);
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
        title="Question bank"
        description={!loaded ? "Loading…" : totalElements === 0 ? "No questions yet." : `${totalElements} question${totalElements === 1 ? "" : "s"}`}
        action={<Button onClick={openCreate}>New question</Button>}
      />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {loaded && totalElements === 0 ? (
        <Card>
          <Text size="sm" c="dimmed">Create a question to start the bank. The table shows the prompt, marks, and the answer key.</Text>
        </Card>
      ) : null}
      {questions.length > 0 ? (
        <Table.ScrollContainer minWidth={860}>
          <Table striped highlightOnHover withTableBorder bg="white" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Question</Table.Th>
                <Table.Th>Marks</Table.Th>
                <Table.Th>Answer key</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {questions.map((question) => (
                <Table.Tr key={question.id}>
                  <Table.Td><Badge variant="light">{typeLabels[question.type]}</Badge></Table.Td>
                  <Table.Td maw={360}>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{question.text}</Text>
                    {question.explanation ? <Text size="xs" c="dimmed" mt={4}>Explanation · {question.explanation}</Text> : null}
                  </Table.Td>
                  <Table.Td>{question.marks}</Table.Td>
                  <Table.Td maw={240}><Text size="sm">{answerSummary(question)}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap" justify="flex-end">
                      <Button tone="ghost" onClick={() => openEdit(question)}>Edit</Button>
                      <Button tone="danger" onClick={() => setDeleting(question)}>Delete</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : null}
      <Pagination page={page} size={size} total={totalElements} onPageChange={setPage} />
      <Modal
        width="lg"
        open={editorOpen}
        onOpenChange={(open) => { if (!open) closeEditor(); }}
        title={editing ? "Edit question" : "New question"}
        description={editing ? "Update the prompt, marks, and answer key." : "Add a question to your bank."}
      >
        <form onSubmit={save}>
          <Stack gap="md">
            {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Field label="Type">
                <SelectField
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value as QuestionType }))}
                  options={[
                    { value: "MCQ", label: "Multiple choice" },
                    { value: "TRUE_FALSE", label: "True / false" },
                    { value: "SHORT_ANSWER", label: "Short answer" },
                  ]}
                />
              </Field>
              <Field label="Marks">
                <TextInput type="number" min={1} value={form.marks} onChange={(event) => setForm((current) => ({ ...current, marks: Number(event.target.value) }))} />
              </Field>
            </SimpleGrid>
            <Field label="Question">
              <Area rows={3} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} required />
            </Field>
            {form.type === "MCQ" ? (
              <Radio.Group
                value={String(form.options.findIndex((option) => option.correct))}
                onChange={(value) => setForm((current) => ({
                  ...current,
                  options: current.options.map((item, itemIndex) => ({ ...item, correct: itemIndex === Number(value) })),
                }))}
              >
                <Stack gap="sm">
                  {form.options.map((option, index) => (
                    <Group key={index} align="center" wrap="nowrap">
                      <TextInput
                        style={{ flex: 1 }}
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item),
                        }))}
                        required
                      />
                      <Radio value={String(index)} label="Correct" />
                      {form.options.length > 2 ? (
                        <Button tone="ghost" onClick={() => setForm((current) => ({
                          ...current,
                          options: current.options.filter((_, itemIndex) => itemIndex !== index),
                        }))}>
                          Remove
                        </Button>
                      ) : null}
                    </Group>
                  ))}
                  <Button
                    tone="ghost"
                    disabled={form.options.length >= 8}
                    onClick={() => setForm((current) => ({ ...current, options: [...current.options, emptyOption()] }))}
                  >
                    Add option
                  </Button>
                </Stack>
              </Radio.Group>
            ) : null}
            {form.type === "TRUE_FALSE" ? (
              <Field label="Correct answer">
                <SelectField
                  value={String(form.correctBoolean)}
                  onValueChange={(value) => setForm((current) => ({ ...current, correctBoolean: value === "true" }))}
                  options={[{ value: "true", label: "True" }, { value: "false", label: "False" }]}
                />
              </Field>
            ) : null}
            {form.type === "SHORT_ANSWER" ? (
              <Field label="Model answer or rubric">
                <Area rows={3} value={form.modelAnswer} onChange={(event) => setForm((current) => ({ ...current, modelAnswer: event.target.value }))} required />
              </Field>
            ) : null}
            <Field label="Explanation shown after grading">
              <TextInput value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} />
            </Field>
            <Group justify="flex-end">
              <Button tone="ghost" onClick={closeEditor}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save question"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete question"
        description={deleting ? "This removes the question from your bank. It must already be off every quiz." : undefined}
      >
        <Group justify="flex-end">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </Group>
      </Modal>
    </>
  );
}

function answerSummary(question: Question) {
  if (question.type === "MCQ") return question.options.find((option) => option.correct)?.text ?? "—";
  if (question.type === "TRUE_FALSE") return question.correctBoolean ? "True" : "False";
  return question.modelAnswer || "—";
}
