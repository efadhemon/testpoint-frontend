"use client";

import { Badge, FileInput, Group, List, Text } from "@mantine/core";
import { FormEvent, useState } from "react";
import { Alert, Area, Button, Card, PageHeader } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { QuestionDraft } from "../../../../lib/types";

export default function GeneratePage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || file.size === 0) return;
    setPending(true);
    setError(null);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      setDrafts(await api<QuestionDraft[]>("/api/questions/generate-from-pdf", { method: "POST", body }, token));
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  function update(index: number, patch: Partial<QuestionDraft>) {
    setDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...patch } : draft));
  }

  async function saveAll() {
    setError(null);
    try {
      await api("/api/questions/bulk", { method: "POST", body: JSON.stringify({ questions: drafts }) }, token);
      setDrafts([]);
      setMessage("Saved to your question bank. Review them there before adding them to a quiz.");
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <PageHeader title="Questions from a lecture PDF" description="The draft stays here until you save it. Nothing is published automatically." />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {message ? <Text size="sm" c="blue">{message}</Text> : null}
      <Card>
        <form onSubmit={upload}>
          <Group align="flex-end">
            <FileInput label="Lecture PDF" placeholder="Choose a PDF" accept="application/pdf" value={file} onChange={setFile} required style={{ flex: 1, minWidth: 240 }} />
            <Button type="submit" disabled={pending || !file}>{pending ? "Reading…" : "Generate drafts"}</Button>
          </Group>
        </form>
      </Card>
      {drafts.map((draft, index) => (
        <Card key={index}>
          <Badge variant="light">{draft.type}</Badge>
          <Area mt="sm" rows={3} value={draft.text} onChange={(event) => update(index, { text: event.target.value })} />
          {draft.type === "SHORT_ANSWER" ? (
            <Area mt="sm" rows={2} value={draft.modelAnswer || ""} onChange={(event) => update(index, { modelAnswer: event.target.value })} />
          ) : null}
          {draft.type === "MCQ" ? (
            <List mt="sm" spacing={4}>
              {(draft.options || []).map((option, optionIndex) => (
                <List.Item key={optionIndex}>{option.correct ? "●" : "○"} {option.text}</List.Item>
              ))}
            </List>
          ) : null}
          {draft.type === "TRUE_FALSE" ? <Text size="sm" mt="sm">Correct answer: {draft.correctBoolean ? "True" : "False"}</Text> : null}
        </Card>
      ))}
      {drafts.length > 0 ? <Group><Button onClick={saveAll}>Save all to the bank</Button></Group> : null}
    </>
  );
}
