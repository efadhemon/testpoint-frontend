"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../../../../components/dialog";
import { Alert, Button, Card, inputClass } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import { formatWhen } from "../../../../lib/format";
import type { ClassGroup, Question, Quiz, QuizStatus } from "../../../../lib/types";
import { emptyQuizForm, formFromQuiz, QuizEditorFields, quizPayload, type QuizFormState } from "../editor";

const statusLabels: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
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
      api<Question[]>("/api/questions", {}, token),
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

  if (!quiz) return <p className="text-sm text-ink/60">Loading quiz…</p>;
  const draft = quiz.status === "DRAFT";
  const questions = [...quiz.questions].sort((a, b) => a.position - b.position);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">{statusLabels[quiz.status]} · {quiz.totalMarks} marks</p>
          <h1 className="font-serif text-4xl">{quiz.title}</h1>
          {quiz.instructions ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">{quiz.instructions}</p> : null}
        </div>
        {draft ? <Button tone="ghost" onClick={openEdit}>Edit</Button> : null}
      </div>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>Opens <span className="font-medium">{formatWhen(quiz.startTime)}</span></div>
          <div>Closes <span className="font-medium">{formatWhen(quiz.endTime)}</span></div>
          <div>Minutes <span className="font-medium">{quiz.durationMinutes}</span></div>
          <div>Attempts <span className="font-medium">{quiz.maxAttempts}</span></div>
          <div>Passing marks <span className="font-medium">{quiz.passingMarks}</span></div>
          <div>Shuffle <span className="font-medium">{quiz.shuffleQuestions ? "On" : "Off"}</span></div>
        </dl>
        <h2 className="mt-4 font-serif text-2xl">Questions</h2>
        {questions.length === 0 ? <p className="mt-2 text-sm text-ink/60">No questions yet.</p> : (
          <ol className="mt-3 space-y-1.5 text-sm">
            {questions.map((question, index) => (
              <li key={question.questionId} className="rounded-xl bg-paper px-3 py-2">
                {index + 1}. {question.text}
                <span className="text-ink/50"> · {question.marks} {question.marks === 1 ? "mark" : "marks"}</span>
              </li>
            ))}
          </ol>
        )}
        {draft ? null : <p className="mt-4 text-sm text-ink/60">Published quizzes stay fixed. Close the window if you want to stop new attempts.</p>}
      </Card>
      <div className="flex flex-wrap gap-2">
        {draft ? <Button onClick={publish}>Publish</Button> : null}
        {quiz.status === "PUBLISHED" ? <Button tone="danger" onClick={closeQuiz}>Close quiz</Button> : null}
      </div>
      {quiz.status === "PUBLISHED" ? (
        <Card>
          <h2 className="font-serif text-2xl">Assign</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <select className={`${inputClass()} max-w-sm`} value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="">Choose a class</option>
              {classes.map((classGroup) => <option key={classGroup.id} value={classGroup.id}>{classGroup.name}</option>)}
            </select>
            <Button onClick={assign} disabled={!classId}>Assign</Button>
          </div>
          <ul className="mt-3 text-sm">
            {quiz.assignments.length === 0 ? <li className="text-ink/50">Not assigned yet.</li> : quiz.assignments.map((assignment) => (
              <li key={assignment.id}>{assignment.className || assignment.studentName} · {formatWhen(quiz.startTime)} to {formatWhen(quiz.endTime)}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Modal
        width="lg"
        open={editing}
        onOpenChange={(open) => { if (!open) closeEdit(); }}
        title="Edit quiz"
        description="Update the window, marks, and questions."
      >
        <form onSubmit={save} className="space-y-4">
          {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
          <QuizEditorFields form={form} setForm={setForm} bank={bank} />
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={closeEdit}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
