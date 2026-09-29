"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { fromLocalInput, toLocalInput } from "../../../lib/format";
import type { Quiz } from "../../../lib/types";

export default function QuizzesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(20);
  const [start, setStart] = useState(toLocalInput(new Date().toISOString()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 7 * 86400000).toISOString()));

  useEffect(() => {
    if (!token) return;
    api<Quiz[]>("/api/quizzes", {}, token).then(setQuizzes).catch(setError);
  }, [token]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const quiz = await api<Quiz>("/api/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title,
          instructions: "",
          durationMinutes: duration,
          startTime: fromLocalInput(start),
          endTime: fromLocalInput(end),
          shuffleQuestions: true,
          maxAttempts: 1,
          passingMarks: 1,
          questionIds: [],
        }),
      }, token);
      router.push(`/instructor/quizzes/${quiz.id}`);
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Quizzes</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <Field label="Title"><input className={inputClass()} value={title} onChange={(event) => setTitle(event.target.value)} required /></Field>
          <Field label="Minutes"><input className={inputClass()} type="number" min={1} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></Field>
          <Field label="Opens"><input className={inputClass()} type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required /></Field>
          <Field label="Closes"><input className={inputClass()} type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} required /></Field>
          <Button type="submit">Create draft</Button>
        </form>
      </Card>
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{quiz.status}</p>
              <h2 className="font-serif text-2xl">{quiz.title}</h2>
              <p className="text-sm text-ink/60">{quiz.questions.length} questions · {quiz.totalMarks} marks · {quiz.durationMinutes} min</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/instructor/quizzes/${quiz.id}`} className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-paper">Open</Link>
              {quiz.status !== "DRAFT" ? <Link href={`/instructor/analytics/${quiz.id}`} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">Analytics</Link> : null}
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
