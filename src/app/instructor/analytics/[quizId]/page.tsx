"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "../../../../components/ui";
import { api } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import { percent } from "../../../../lib/format";
import type { QuizAnalytics } from "../../../../lib/types";

export default function AnalyticsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { token } = useAuth();
  const [report, setReport] = useState<QuizAnalytics | null>(null);

  useEffect(() => {
    if (!token) return;
    api<QuizAnalytics>(`/api/analytics/quizzes/${quizId}`, {}, token).then(setReport).catch(() => setReport(null));
  }, [token, quizId]);

  if (!report) return <p className="text-sm text-ink/60">Loading the report…</p>;

  return (
    <>
      <h1 className="font-serif text-4xl">{report.title}</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Submitted attempts</p><p className="font-serif text-4xl">{report.attemptCount}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Average</p><p className="font-serif text-4xl">{percent(report.averagePercent)}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Pass rate</p><p className="font-serif text-4xl">{percent(report.passRate)}</p></Card>
      </div>
      <Card>
        <h2 className="font-serif text-2xl">Question accuracy</h2>
        <ul className="mt-4 space-y-4">
          {report.questions.map((question) => (
            <li key={question.questionId}>
              <div className="flex justify-between gap-3 text-sm">
                <span>{question.text}</span>
                <span>{percent(question.accuracyPercent)} · {question.responses}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-line">
                <div className="h-2 rounded-full bg-pine" style={{ width: `${Math.min(100, question.accuracyPercent)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
