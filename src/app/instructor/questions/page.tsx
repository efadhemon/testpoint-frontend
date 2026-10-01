"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
import { Alert, Button, Card, Field, inputClass } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Option, Question, QuestionType } from "../../../lib/types";

const typeLabels: Record<QuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / false",
  SHORT_ANSWER: "Short answer",
};

type FormState = {
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string;
  modelAnswer: string;
  correctBoolean: boolean;
  options: Option[];
};

const emptyOption = (): Option => ({ text: "", correct: false });

function emptyForm(): FormState {
  return {
    type: "MCQ",
    text: "",
    marks: 1,
    explanation: "",
    modelAnswer: "",
    correctBoolean: true,
    options: [emptyOption(), emptyOption()],
  };
}

function formFromQuestion(question: Question): FormState {
  return {
    type: question.type,
    text: question.text,
    marks: question.marks,
    explanation: question.explanation ?? "",
    modelAnswer: question.modelAnswer ?? "",
    correctBoolean: question.correctBoolean ?? true,
    options: question.options.length >= 2
      ? question.options.map((option) => ({ text: option.text, correct: option.correct }))
      : [emptyOption(), emptyOption()],
  };
}

function payload(form: FormState) {
  return {
    type: form.type,
    text: form.text,
    marks: form.marks,
    explanation: form.explanation || null,
    modelAnswer: form.type === "SHORT_ANSWER" ? form.modelAnswer : null,
    correctBoolean: form.type === "TRUE_FALSE" ? form.correctBoolean : null,
    options: form.type === "MCQ" ? form.options : [],
  };
}

export default function QuestionsPage() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [formError, setFormError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const editorOpen = creating || editing !== null;

  const fetchQuestions = useCallback(
    () => api<Question[]>("/api/questions", {}, token),
    [token],
  );

  async function load() {
    setQuestions(await fetchQuestions());
  }

  useEffect(() => {
    if (!token) return;
    fetchQuestions().then(setQuestions).catch(setError);
  }, [token, fetchQuestions]);

  function openCreate() {
    setForm(emptyForm());
    setFormError(null);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(question: Question) {
    setForm(formFromQuestion(question));
    setFormError(null);
    setCreating(false);
    setEditing(question);
  }

  function closeEditor() {
    setCreating(false);
    setEditing(null);
    setFormError(null);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (editing) {
        await api(`/api/questions/${editing.id}`, { method: "PUT", body: JSON.stringify(payload(form)) }, token);
      } else {
        await api("/api/questions", { method: "POST", body: JSON.stringify(payload(form)) }, token);
      }
      closeEditor();
      await load();
    } catch (caught) {
      setFormError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/questions/${deleting.id}`, { method: "DELETE" }, token);
      setDeleting(null);
      await load();
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Question bank</h1>
          <p className="mt-1 text-sm text-ink/60">
            {questions.length === 0 ? "No questions yet." : `${questions.length} question${questions.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button onClick={openCreate}>New question</Button>
      </div>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-ink/70">Create a question to start the bank. Each card shows the prompt, marks, and the answer key.</p>
        </Card>
      ) : null}
      {questions.map((question) => (
        <Card key={question.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-ink/50">
                {typeLabels[question.type]} · {question.marks} {question.marks === 1 ? "mark" : "marks"}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{question.text}</p>
            </div>
            <div className="flex gap-2">
              <Button tone="ghost" onClick={() => openEdit(question)}>Edit</Button>
              <Button tone="danger" onClick={() => setDeleting(question)}>Delete</Button>
            </div>
          </div>
          <QuestionKey question={question} />
        </Card>
      ))}
      <Modal
        width="lg"
        open={editorOpen}
        onOpenChange={(open) => { if (!open) closeEditor(); }}
        title={editing ? "Edit question" : "New question"}
        description={editing ? "Update the prompt, marks, and answer key." : "Add a question to your bank."}
      >
        <form onSubmit={save} className="space-y-4">
          {formError ? <Alert>{errorMessage(formError)}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <select className={inputClass()} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as QuestionType }))}>
                <option value="MCQ">Multiple choice</option>
                <option value="TRUE_FALSE">True / false</option>
                <option value="SHORT_ANSWER">Short answer</option>
              </select>
            </Field>
            <Field label="Marks">
              <input className={inputClass()} type="number" min={1} value={form.marks} onChange={(event) => setForm((current) => ({ ...current, marks: Number(event.target.value) }))} />
            </Field>
          </div>
          <Field label="Question">
            <textarea className={inputClass()} rows={3} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} required />
          </Field>
          {form.type === "MCQ" ? (
            <div className="space-y-2">
              {form.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={inputClass()}
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      options: current.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item),
                    }))}
                    required
                  />
                  <label className="flex shrink-0 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="correct"
                      checked={option.correct}
                      onChange={() => setForm((current) => ({
                        ...current,
                        options: current.options.map((item, itemIndex) => ({ ...item, correct: itemIndex === index })),
                      }))}
                    />
                    Correct
                  </label>
                  {form.options.length > 2 ? (
                    <Button tone="ghost" onClick={() => setForm((current) => ({
                      ...current,
                      options: current.options.filter((_, itemIndex) => itemIndex !== index),
                    }))}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                tone="ghost"
                disabled={form.options.length >= 8}
                onClick={() => setForm((current) => ({ ...current, options: [...current.options, emptyOption()] }))}
              >
                Add option
              </Button>
            </div>
          ) : null}
          {form.type === "TRUE_FALSE" ? (
            <Field label="Correct answer">
              <select className={inputClass()} value={String(form.correctBoolean)} onChange={(event) => setForm((current) => ({ ...current, correctBoolean: event.target.value === "true" }))}>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </Field>
          ) : null}
          {form.type === "SHORT_ANSWER" ? (
            <Field label="Model answer or rubric">
              <textarea className={inputClass()} rows={3} value={form.modelAnswer} onChange={(event) => setForm((current) => ({ ...current, modelAnswer: event.target.value }))} required />
            </Field>
          ) : null}
          <Field label="Explanation shown after grading">
            <input className={inputClass()} value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={closeEditor}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Save question"}</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete question"
        description={deleting ? "This removes the question from your bank. It must already be off every quiz." : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </div>
      </Modal>
    </>
  );
}

function QuestionKey({ question }: { question: Question }) {
  return (
    <div className="mt-4 space-y-2 border-t border-line pt-4">
      {question.type === "MCQ" ? (
        <ul className="space-y-1.5">
          {question.options.map((option) => (
            <li key={option.id} className={`rounded-xl px-3 py-2 text-sm ${option.correct ? "bg-moss font-medium text-pine" : "bg-paper text-ink/80"}`}>
              {option.correct ? "Correct · " : ""}{option.text}
            </li>
          ))}
        </ul>
      ) : null}
      {question.type === "TRUE_FALSE" ? (
        <p className="text-sm">
          Correct answer <span className="font-semibold text-pine">{question.correctBoolean ? "True" : "False"}</span>
        </p>
      ) : null}
      {question.type === "SHORT_ANSWER" && question.modelAnswer ? (
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">Model answer</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{question.modelAnswer}</p>
        </div>
      ) : null}
      {question.explanation ? (
        <p className="text-sm text-ink/60">Explanation · {question.explanation}</p>
      ) : null}
    </div>
  );
}
