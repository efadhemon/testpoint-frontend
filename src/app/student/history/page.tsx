"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../../../components/ui";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { formatWhen, percent } from "../../../lib/format";
import type { StudentAnalytics } from "../../../lib/types";

export default function HistoryPage() {
  const { token } = useAuth();
  const [report, setReport] = useState<StudentAnalytics | null>(null);

  useEffect(() => {
    if (!token) return;
    api<StudentAnalytics>("/api/analytics/me", {}, token).then(setReport).catch(() => setReport(null));
  }, [token]);

  return (
    <>
      <h1 className="font-serif text-4xl">History</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Finished attempts</p><p className="font-serif text-4xl">{report?.attemptCount ?? "—"}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Average</p><p className="font-serif text-4xl">{percent(report?.averagePercent)}</p></Card>
      </div>
      {(report?.history ?? []).map((item) => (
        <Card key={item.attemptId}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{item.quizTitle}</h2>
              <p className="text-sm text-ink/60">{item.status} · {item.score ?? "—"}/{item.maxScore ?? "—"} · {formatWhen(item.submittedAt)}</p>
            </div>
            {item.status !== "IN_PROGRESS" ? <Link href={`/student/results/${item.attemptId}`} className="text-sm font-semibold text-pine">Result</Link> : <Link href={`/student/attempt/${item.attemptId}`} className="text-sm font-semibold text-pine">Continue</Link>}
          </div>
        </Card>
      ))}
    </>
  );
}
