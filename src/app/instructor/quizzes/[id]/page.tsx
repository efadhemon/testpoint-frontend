"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import { formatWhen, fromLocalInput, toLocalInput } from "../../../../lib/format";
import type { ClassGroup, Question, Quiz } from "../../../../lib/types";

export default function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [bank, setBank] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState(20);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [passingMarks, setPassingMarks] = useState(1);
  const [shuffle, setShuffle] = useState(true);

  async function load() {
    const [nextQuiz, questions, groups] = await Promise.all([
      api<Quiz>(`/api/quizzes/${id}`, {}, token),
      api<Question[]>("/api/questions", {}, token),
      api<ClassGroup[]>("/api/classes", {}, token),
    ]);
    setQuiz(nextQuiz);
    setBank(questions);
    setClasses(groups);
    setSelected(nextQuiz.questions.map((question) => question.questionId));
    setTitle(nextQuiz.title);
    setInstructions(nextQuiz.instructions || "");
    setDuration(nextQuiz.durationMinutes);
    setStart(toLocalInput(nextQuiz.startTime));
    setEnd(toLocalInput(nextQuiz.endTime));
    setMaxAttempts(nextQuiz.maxAttempts);
    setPassingMarks(nextQuiz.passingMarks);
    setShuffle(nextQuiz.shuffleQuestions);
  }

  useEffect(() => {
    if (token) load().catch(setError);
  }, [token, id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      setQuiz(await api<Quiz>(`/api/quizzes/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          instructions,
          durationMinutes: duration,
          startTime: fromLocalInput(start),
          endTime: fromLocalInput(end),
          shuffleQuestions: shuffle,
          maxAttempts,
          passingMarks,
          questionIds: selected,
        }),
      }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  async function publish() {
    setError(null);
    try {
      setQuiz(await api<Quiz>(`/api/quizzes/${id}/publish`, { method: "POST" }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  async function closeQuiz() {
    setError(null);
    try {
      setQuiz(await api<Quiz>(`/api/quizzes/${id}/close`, { method: "POST" }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  async function assign() {
    setError(null);
    try {
      setQuiz(await api<Quiz>(`/api/quizzes/${id}/assign`, { method: "POST", body: JSON.stringify({ classId: Number(classId), studentIds: [] }) }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  function toggle(questionId: number) {
    setSelected((current) => current.includes(questionId) ? current.filter((item) => item !== questionId) : [...current, questionId]);
  }

  if (!quiz) return <p className="text-sm text-ink/60">Loading quiz…</p>;
  const draft = quiz.status === "DRAFT";

  return (
    <>
      <p className="text-xs uppercase tracking-wide text-ink/50">{quiz.status} · {quiz.totalMarks} marks</p>
      <h1 className="font-serif text-4xl">{quiz.title}</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title"><input className={inputClass()} value={title} onChange={(event) => setTitle(event.target.value)} disabled={!draft} required /></Field>
          <Field label="Instructions"><textarea className={inputClass()} rows={2} value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={!draft} /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Minutes"><input className={inputClass()} type="number" min={1} value={duration} onChange={(event) => setDuration(Number(event.target.value))} disabled={!draft} /></Field>
            <Field label="Passing marks"><input className={inputClass()} type="number" min={0} value={passingMarks} onChange={(event) => setPassingMarks(Number(event.target.value))} disabled={!draft} /></Field>
            <Field label="Opens"><input className={inputClass()} type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} disabled={!draft} required /></Field>
            <Field label="Closes"><input className={inputClass()} type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} disabled={!draft} required /></Field>
            <Field label="Attempts allowed"><input className={inputClass()} type="number" min={1} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} disabled={!draft} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} disabled={!draft} /> Shuffle question order</label>
          </div>
          {draft ? <Button type="submit">Save draft</Button> : <p className="text-sm text-ink/60">Published quizzes stay fixed. Close the window if you want to stop new attempts.</p>}
        </form>
      </Card>
      <Card>
        <h2 className="font-serif text-2xl">Questions</h2>
        {bank.length === 0 ? <p className="mt-2 text-sm text-ink/60">Add questions to the bank first.</p> : null}
        <ul className="mt-3 space-y-2">
          {bank.map((question) => (
            <li key={question.id}>
              <label className="flex gap-3 text-sm">
                <input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggle(question.id)} disabled={!draft} />
                <span><span className="text-ink/50">{question.type}</span> · {question.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex flex-wrap gap-2">
        {draft ? <Button onClick={publish}>Publish</Button> : null}
        {quiz.status === "PUBLISHED" ? <Button tone="danger" onClick={closeQuiz}>Close quiz</Button> : null}
      </div>
      {quiz.status === "PUBLISHED" ? (
        <Card>
          <h2 className="font-serif text-2xl">Assign</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <select className={inputClass()} value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="">Choose a class</option>
              {classes.map((classGroup) => <option key={classGroup.id} value={classGroup.id}>{classGroup.name}</option>)}
            </select>
            <Button onClick={assign} disabled={!classId}>Assign</Button>
          </div>
          <ul className="mt-3 text-sm">
            {quiz.assignments.map((assignment) => (
              <li key={assignment.id}>{assignment.className || assignment.studentName} · {formatWhen(quiz.startTime)} to {formatWhen(quiz.endTime)}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
