"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Option, Question, QuestionType } from "../../../lib/types";

const emptyOption = (): Option => ({ text: "", correct: false });

export default function QuestionsPage() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [type, setType] = useState<QuestionType>("MCQ");
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [correctBoolean, setCorrectBoolean] = useState(true);
  const [options, setOptions] = useState<Option[]>([emptyOption(), emptyOption()]);
  const [error, setError] = useState<unknown>(null);

  async function load() {
    setQuestions(await api<Question[]>("/api/questions", {}, token));
  }

  useEffect(() => {
    if (token) load().catch(setError);
  }, [token]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api("/api/questions", {
        method: "POST",
        body: JSON.stringify({
          type,
          text,
          marks,
          explanation: explanation || null,
          modelAnswer: type === "SHORT_ANSWER" ? modelAnswer : null,
          correctBoolean: type === "TRUE_FALSE" ? correctBoolean : null,
          options: type === "MCQ" ? options : [],
        }),
      }, token);
      setText("");
      setExplanation("");
      setModelAnswer("");
      setOptions([emptyOption(), emptyOption()]);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api(`/api/questions/${id}`, { method: "DELETE" }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Question bank</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={create} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Type">
              <select className={inputClass()} value={type} onChange={(event) => setType(event.target.value as QuestionType)}>
                <option value="MCQ">Multiple choice</option>
                <option value="TRUE_FALSE">True / false</option>
                <option value="SHORT_ANSWER">Short answer</option>
              </select>
            </Field>
            <Field label="Marks">
              <input className={inputClass()} type="number" min={1} value={marks} onChange={(event) => setMarks(Number(event.target.value))} />
            </Field>
          </div>
          <Field label="Question">
            <textarea className={inputClass()} rows={3} value={text} onChange={(event) => setText(event.target.value)} required />
          </Field>
          {type === "MCQ" ? (
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input className={inputClass()} placeholder={`Option ${index + 1}`} value={option.text} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} required />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="correct" checked={option.correct} onChange={() => setOptions((current) => current.map((item, itemIndex) => ({ ...item, correct: itemIndex === index })))} />
                    Correct
                  </label>
                </div>
              ))}
              <Button tone="ghost" onClick={() => setOptions((current) => [...current, emptyOption()])}>Add option</Button>
            </div>
          ) : null}
          {type === "TRUE_FALSE" ? (
            <Field label="Correct answer">
              <select className={inputClass()} value={String(correctBoolean)} onChange={(event) => setCorrectBoolean(event.target.value === "true")}>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </Field>
          ) : null}
          {type === "SHORT_ANSWER" ? (
            <Field label="Model answer or rubric">
              <textarea className={inputClass()} rows={3} value={modelAnswer} onChange={(event) => setModelAnswer(event.target.value)} required />
            </Field>
          ) : null}
          <Field label="Explanation shown after grading">
            <input className={inputClass()} value={explanation} onChange={(event) => setExplanation(event.target.value)} />
          </Field>
          <Button type="submit">Save question</Button>
        </form>
      </Card>
      {questions.map((question) => (
        <Card key={question.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50">{question.type.replace("_", " ")} · {question.marks} marks</p>
              <p className="mt-1">{question.text}</p>
            </div>
            <Button tone="ghost" onClick={() => remove(question.id)}>Delete</Button>
          </div>
        </Card>
      ))}
    </>
  );
}
