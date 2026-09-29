"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button } from "../../../../components/ui";
import { api, errorMessage } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";
import type { TakeQuestion, TakeView } from "../../../../lib/types";

type AnswerState = { optionId: number | null; booleanAnswer: boolean | null; textAnswer: string | null };

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<TakeView | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [error, setError] = useState<unknown>(null);
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const hydrated = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!token) return;
    api<TakeView>(`/api/attempts/${id}`, {}, token)
      .then((loaded) => {
        setView(loaded);
        setOffset(new Date(loaded.serverNow).getTime() - Date.now());
        setAnswers(Object.fromEntries(loaded.questions.map((question) => [question.id, {
          optionId: question.answer.optionId,
          booleanAnswer: question.answer.booleanAnswer,
          textAnswer: question.answer.textAnswer,
        }])));
        hydrated.current = false;
      })
      .catch((caught) => {
        if (errorMessage(caught).includes("already submitted")) router.replace(`/student/results/${id}`);
        else setError(caught);
      });
  }, [token, id, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!view) return 0;
    return new Date(view.expiresAt).getTime() - (now + offset);
  }, [view, now, offset]);

  useEffect(() => {
    if (!view || remaining > 0) return;
    submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0 && view != null]);

  function currentPayload() {
    return {
      answers: Object.entries(answersRef.current).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        optionId: answer.optionId,
        booleanAnswer: answer.booleanAnswer,
        textAnswer: answer.textAnswer,
      })),
    };
  }

  useEffect(() => {
    if (!view || !token) return;
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ submitted: boolean }>(`/api/attempts/${id}/answers`, {
        method: "PUT",
        body: JSON.stringify(currentPayload()),
      }, token).then((response) => {
        if (response.submitted) router.replace(`/student/results/${id}`);
      }).catch((caught) => setError(caught));
    }, 500);
    return () => window.clearTimeout(handle);
  }, [answers, token, view, id, router]);

  async function submit(auto = false) {
    try {
      await api(`/api/attempts/${id}/submit`, { method: "POST", body: JSON.stringify(currentPayload()) }, token);
      router.replace(`/student/results/${id}`);
    } catch (caught) {
      if (!auto) setError(caught);
    }
  }

  if (!view) return error ? <Alert>{errorMessage(error)}</Alert> : <p className="text-sm text-ink/60">Loading the paper…</p>;
  const minutes = Math.max(0, Math.floor(remaining / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
        <h1 className="font-serif text-2xl">{view.quizTitle}</h1>
        <p className={`font-semibold ${remaining < 60000 ? "text-copper" : "text-pine"}`}>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</p>
      </div>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      {view.questions.map((question, index) => (
        <QuestionCard key={question.id} index={index} question={question} answer={answers[question.id]} onChange={(next) => setAnswers((current) => ({ ...current, [question.id]: next }))} />
      ))}
      <Button onClick={() => submit(false)}>Submit</Button>
    </>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: TakeQuestion;
  answer: AnswerState;
  onChange: (answer: AnswerState) => void;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">Question {index + 1} · {question.marks} {question.marks === 1 ? "mark" : "marks"}</p>
      <h2 className="mt-1 text-lg">{question.text}</h2>
      {question.type === "MCQ" ? (
        <div className="mt-3 space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="flex gap-2 text-sm">
              <input type="radio" name={`q-${question.id}`} checked={answer?.optionId === option.id} onChange={() => onChange({ optionId: option.id, booleanAnswer: null, textAnswer: null })} />
              {option.text}
            </label>
          ))}
        </div>
      ) : null}
      {question.type === "TRUE_FALSE" ? (
        <div className="mt-3 flex gap-4 text-sm">
          {[true, false].map((value) => (
            <label key={String(value)} className="flex gap-2">
              <input type="radio" name={`q-${question.id}`} checked={answer?.booleanAnswer === value} onChange={() => onChange({ optionId: null, booleanAnswer: value, textAnswer: null })} />
              {value ? "True" : "False"}
            </label>
          ))}
        </div>
      ) : null}
      {question.type === "SHORT_ANSWER" ? (
        <textarea className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2" rows={4} value={answer?.textAnswer || ""} onChange={(event) => onChange({ optionId: null, booleanAnswer: null, textAnswer: event.target.value })} />
      ) : null}
    </section>
  );
}
