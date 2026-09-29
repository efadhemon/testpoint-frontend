"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "../../components/ui";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { InstructorSummary } from "../../lib/types";

export default function InstructorHome() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<InstructorSummary | null>(null);

  useEffect(() => {
    if (!token) return;
    api<InstructorSummary>("/api/instructor/summary", {}, token).then(setSummary).catch(() => setSummary(null));
  }, [token]);

  return (
    <>
      <h1 className="font-serif text-4xl">Your desk</h1>
      <p className="text-ink/70">Build questions, publish a timed quiz, then grade the written answers.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Classes</p><p className="font-serif text-4xl">{summary?.classCount ?? "—"}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Quizzes</p><p className="font-serif text-4xl">{summary?.quizCount ?? "—"}</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/50">Waiting for a mark</p><p className="font-serif text-4xl">{summary?.pendingGrades ?? "—"}</p></Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/instructor/quizzes" className="rounded-full bg-pine px-4 py-2 text-sm font-semibold text-paper">Open quizzes</Link>
        <Link href="/instructor/grading" className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">Grade short answers</Link>
      </div>
    </>
  );
}
