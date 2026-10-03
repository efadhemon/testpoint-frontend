"use client";

import { Group, SimpleGrid } from "@mantine/core";
import { useEffect, useState } from "react";
import { Button, PageHeader, Stat } from "../../components/ui";
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
      <PageHeader title="Overview" description="Build questions, publish a timed quiz, then grade the written answers." />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Stat label="Classes" value={summary?.classCount ?? "—"} />
        <Stat label="Quizzes" value={summary?.quizCount ?? "—"} />
        <Stat label="Waiting for a mark" value={summary?.pendingGrades ?? "—"} />
      </SimpleGrid>
      <Group>
        <Button href="/instructor/quizzes">Open quizzes</Button>
        <Button tone="ghost" href="/instructor/grading">Grade short answers</Button>
      </Group>
    </>
  );
}
