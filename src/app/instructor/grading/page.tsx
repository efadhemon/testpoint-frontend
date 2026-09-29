"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { PendingAnswer } from "../../../lib/types";

export default function GradingPage() {
  const { token } = useAuth();
  const [pending, setPending] = useState<PendingAnswer[]>([]);
  const [ready, setReady] = useState(false);
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [error, setError] = useState<unknown>(null);

  async function load() {
    const rows = await api<PendingAnswer[]>("/api/grading/pending", {}, token);
    setPending(rows);
    setMarks(Object.fromEntries(rows.map((row) => [row.answerId, row.marks])));
    setReady(true);
  }

  useEffect(() => {
    if (token) load().catch((caught) => { setError(caught); setReady(true); });
  }, [token]);

  async function grade(answerId: number) {
    setError(null);
    try {
      await api(`/api/grading/answers/${answerId}`, {
        method: "POST",
        body: JSON.stringify({ awardedMarks: marks[answerId] ?? 0, feedback: feedback[answerId] || "" }),
      }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function gradeAi(attemptId: number) {
    setError(null);
    try {
      await api(`/api/grading/attempts/${attemptId}/ai`, { method: "POST" }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  const attempts = [...new Set(pending.map((row) => row.attemptId))];

  return (
    <>
      <h1 className="font-serif text-4xl">Short answers</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {ready && pending.length === 0 ? <p className="text-ink/60">Nothing is waiting for a mark.</p> : null}
      {attempts.map((attemptId) => (
        <div key={attemptId} className="space-y-3">
          <Button tone="ghost" onClick={() => gradeAi(attemptId)}>Suggest marks with AI</Button>
          {pending.filter((row) => row.attemptId === attemptId).map((row) => (
            <Card key={row.answerId}>
              <p className="text-xs uppercase tracking-wide text-ink/50">{row.quizTitle} · {row.studentName}</p>
              <h2 className="mt-1 font-serif text-2xl">{row.questionText}</h2>
              <p className="mt-3 text-sm"><span className="text-ink/50">Rubric. </span>{row.modelAnswer}</p>
              <p className="mt-2 text-sm"><span className="text-ink/50">Answer. </span>{row.textAnswer || "No answer"}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_auto]">
                <Field label={`Marks out of ${row.marks}`}>
                  <input className={inputClass()} type="number" min={0} max={row.marks} value={marks[row.answerId] ?? 0} onChange={(event) => setMarks((current) => ({ ...current, [row.answerId]: Number(event.target.value) }))} />
                </Field>
                <Field label="Feedback">
                  <input className={inputClass()} value={feedback[row.answerId] || ""} onChange={(event) => setFeedback((current) => ({ ...current, [row.answerId]: event.target.value }))} />
                </Field>
                <div className="flex items-end"><Button onClick={() => grade(row.answerId)}>Save mark</Button></div>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </>
  );
}
