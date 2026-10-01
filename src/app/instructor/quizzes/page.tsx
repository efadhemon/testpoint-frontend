"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
import { Alert, Button, Card } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { formatWhen } from "../../../lib/format";
import type { Question, Quiz, QuizStatus } from "../../../lib/types";
import { emptyQuizForm, formFromQuiz, QuizEditorFields, quizPayload, type QuizFormState } from "./editor";

const statusLabels: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export default function QuizzesPage() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [bank, setBank] = useState<Question[]>([]);
  const [form, setForm] = useState<QuizFormState>(emptyQuizForm);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Quiz | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const editorOpen = creating || editing !== null;

  const fetchPage = useCallback(
    () => Promise.all([
      api<Quiz[]>("/api/quizzes", {}, token),
      api<Question[]>("/api/questions", {}, token),
    ]),
    [token],
  );

  async function load() {
    const [nextQuizzes, questions] = await fetchPage();
    setQuizzes(nextQuizzes);
    setBank(questions);
  }

  useEffect(() => {
    if (!token) return;
    fetchPage().then(([nextQuizzes, questions]) => {
      setQuizzes(nextQuizzes);
      setBank(questions);
    }).catch(setError);
  }, [token, fetchPage]);

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
      await load();
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
      await load();
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Quizzes</h1>
          <p className="mt-1 text-sm text-ink/60">
            {quizzes.length === 0 ? "No quizzes yet." : `${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"}`}
          </p>
        </div>
        <Button onClick={openCreate}>New quiz</Button>
      </div>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {quizzes.length === 0 ? (
        <Card>
          <p className="text-sm text-ink/70">Create a draft to set the window, marks, and questions. Publish it from the quiz page once it is ready.</p>
        </Card>
      ) : null}
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-ink/50">
                {statusLabels[quiz.status]} · {quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"} · {quiz.totalMarks} marks · {quiz.durationMinutes} min
              </p>
              <h2 className="mt-1 font-serif text-2xl">{quiz.title}</h2>
              {quiz.instructions ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{quiz.instructions}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {quiz.status === "DRAFT" ? <Button tone="ghost" onClick={() => openEdit(quiz)}>Edit</Button> : null}
              <Link href={`/instructor/quizzes/${quiz.id}`} className="inline-flex items-center justify-center rounded-full bg-pine px-4 py-2 text-sm font-semibold text-paper">Open</Link>
              {quiz.status !== "DRAFT" ? <Link href={`/instructor/analytics/${quiz.id}`} className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold">Analytics</Link> : null}
              <Button tone="danger" onClick={() => setDeleting(quiz)}>Delete</Button>
            </div>
          </div>
          <QuizFacts quiz={quiz} />
        </Card>
      ))}
      <Modal
        width="lg"
        open={editorOpen}
        onOpenChange={(open) => { if (!open) closeEditor(); }}
        title={editing ? "Edit quiz" : "New quiz"}
        description={editing ? "Update the window, marks, and questions. Only a draft can be edited." : "Start a draft. You can publish it after the questions are in place."}
      >
        <form onSubmit={save} className="space-y-4">
          {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
          <QuizEditorFields form={form} setForm={setForm} bank={bank} />
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={closeEditor}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create draft"}</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete quiz"
        description={deleting ? `${deleting.title} will be removed. A quiz that already has attempts cannot be deleted.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </div>
      </Modal>
    </>
  );
}

function QuizFacts({ quiz }: { quiz: Quiz }) {
  const assigned = quiz.assignments.map((assignment) => assignment.className || assignment.studentName).filter(Boolean);
  const questions = [...quiz.questions].sort((a, b) => a.position - b.position);

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
      <dl className="grid gap-2 sm:grid-cols-2">
        <div>Opens <span className="font-medium">{formatWhen(quiz.startTime)}</span></div>
        <div>Closes <span className="font-medium">{formatWhen(quiz.endTime)}</span></div>
        <div>Attempts <span className="font-medium">{quiz.maxAttempts}</span></div>
        <div>Passing marks <span className="font-medium">{quiz.passingMarks}</span></div>
        <div>Shuffle <span className="font-medium">{quiz.shuffleQuestions ? "On" : "Off"}</span></div>
        <div>Assigned <span className="font-medium">{assigned.length === 0 ? "Not assigned" : assigned.join(", ")}</span></div>
      </dl>
      {questions.length === 0 ? <p className="text-ink/50">No questions yet.</p> : (
        <ol className="space-y-1.5">
          {questions.map((question, index) => (
            <li key={question.questionId} className="rounded-xl bg-paper px-3 py-2">
              {index + 1}. {question.text}
              <span className="text-ink/50"> · {question.marks} {question.marks === 1 ? "mark" : "marks"}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
