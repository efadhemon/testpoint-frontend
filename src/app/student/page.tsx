"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { formatWhen } from "../../lib/format";
import type { ClassGroup, StudentQuiz } from "../../lib/types";

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
      <h1 className="font-serif text-4xl">Your quizzes</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={join} className="flex flex-wrap items-end gap-3">
          <div className="min-w-48">
            <Field label="Join a class">
              <input className={inputClass()} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Join code" required />
            </Field>
          </div>
          <Button type="submit">Join</Button>
        </form>
        <p className="mt-3 text-sm text-ink/60">{classes.length === 0 ? "You are not in a class yet." : classes.map((item) => item.name).join(", ")}</p>
      </Card>
      {quizzes.length === 0 ? <p className="text-ink/60">No quiz is assigned yet.</p> : null}
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <p className="text-xs uppercase tracking-wide text-ink/50">{quiz.windowState} · {quiz.durationMinutes} min</p>
          <h2 className="font-serif text-2xl">{quiz.title}</h2>
          <p className="mt-1 text-sm text-ink/70">{quiz.instructions}</p>
          <p className="mt-2 text-sm text-ink/60">{formatWhen(quiz.startTime)} – {formatWhen(quiz.endTime)} · {quiz.attemptsUsed}/{quiz.maxAttempts} attempts used</p>
          <div className="mt-4">
            {quiz.windowState === "OPEN" && (quiz.inProgressAttemptId || quiz.attemptsUsed < quiz.maxAttempts) ? (
              <Button onClick={() => start(quiz)}>{quiz.inProgressAttemptId ? "Continue" : "Start"}</Button>
            ) : (
              <span className="text-sm text-ink/50">{quiz.windowState === "UPCOMING" ? "Not open yet" : "No attempts left"}</span>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}
