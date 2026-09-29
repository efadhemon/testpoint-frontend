"use client";

import { FormEvent, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { QuestionDraft } from "../../../../lib/types";

export default function GeneratePage() {
  const { token } = useAuth();
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || file.size === 0) return;
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
      <h1 className="font-serif text-4xl">Questions from a lecture PDF</h1>
      <p className="text-ink/70">The draft stays here until you save it. Nothing is published automatically.</p>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {message ? <p className="text-sm text-pine">{message}</p> : null}
      <Card>
        <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
          <Field label="Lecture PDF">
            <input name="file" type="file" accept="application/pdf" className={inputClass()} required />
          </Field>
          <Button type="submit" disabled={pending}>{pending ? "Reading…" : "Generate drafts"}</Button>
        </form>
      </Card>
      {drafts.map((draft, index) => (
        <Card key={index}>
          <p className="text-xs uppercase tracking-wide text-ink/50">{draft.type}</p>
          <textarea className={`${inputClass()} mt-2`} rows={3} value={draft.text} onChange={(event) => update(index, { text: event.target.value })} />
          {draft.type === "SHORT_ANSWER" ? (
            <textarea className={`${inputClass()} mt-2`} rows={2} value={draft.modelAnswer || ""} onChange={(event) => update(index, { modelAnswer: event.target.value })} />
          ) : null}
          {draft.type === "MCQ" ? (
            <ul className="mt-2 space-y-1 text-sm">
              {(draft.options || []).map((option, optionIndex) => (
                <li key={optionIndex}>{option.correct ? "●" : "○"} {option.text}</li>
              ))}
            </ul>
          ) : null}
          {draft.type === "TRUE_FALSE" ? <p className="mt-2 text-sm">Correct answer: {draft.correctBoolean ? "True" : "False"}</p> : null}
        </Card>
      ))}
      {drafts.length > 0 ? <Button onClick={saveAll}>Save all to the bank</Button> : null}
    </>
  );
}
