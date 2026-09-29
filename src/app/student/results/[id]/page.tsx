"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Card } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { ResultView } from "../../../../lib/types";

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [result, setResult] = useState<ResultView | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!token) return;
    api<ResultView>(`/api/attempts/${id}/result`, {}, token).then(setResult).catch(setError);
  }, [token, id]);

  async function summarize() {
    setError(null);
    try {
      setResult(await api<ResultView>(`/api/attempts/${id}/ai-summary`, { method: "POST" }, token));
    } catch (caught) {
      setError(caught);
    }
  }

  if (!result) return error ? <Alert>{errorMessage(error)}</Alert> : <p className="text-sm text-ink/60">Loading your result…</p>;

  return (
    <>
      <h1 className="font-serif text-4xl">{result.quizTitle}</h1>
      <Card>
        <p className="font-serif text-5xl">{result.score ?? 0}<span className="text-2xl text-ink/40"> / {result.maxScore ?? 0}</span></p>
        <p className="mt-2 text-sm text-ink/70">
          {result.pendingReview ? "Objective questions are marked. Short answers are still with your instructor." : result.passed ? "You reached the passing mark." : "You did not reach the passing mark."}
        </p>
        {result.status === "GRADED" ? <div className="mt-4"><Button tone="ghost" onClick={summarize}>Write an AI summary</Button></div> : null}
        {result.aiSummary ? <p className="mt-4 text-sm leading-6">{result.aiSummary}</p> : null}
      </Card>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {result.questions.map((question, index) => (
        <Card key={`${question.questionId}-${index}`}>
          <p className="text-xs uppercase tracking-wide text-ink/50">
            {question.awardedMarks == null ? "Pending" : `${question.awardedMarks}/${question.marks}`}
            {question.gradeSource ? ` · ${question.gradeSource.toLowerCase()}` : ""}
          </p>
          <h2 className="mt-1 text-lg">{question.text}</h2>
          <p className="mt-3 text-sm"><span className="text-ink/50">Your answer. </span>{question.yourAnswer}</p>
          {question.correctAnswer ? <p className="mt-1 text-sm"><span className="text-ink/50">Expected. </span>{question.correctAnswer}</p> : null}
          {question.feedback ? <p className="mt-2 text-sm text-pine">{question.feedback}</p> : null}
        </Card>
      ))}
    </>
  );
}
