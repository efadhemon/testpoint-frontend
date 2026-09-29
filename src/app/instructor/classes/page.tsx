"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert, Button, Card, Field, inputClass } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { ClassGroup } from "../../../lib/types";

export default function ClassesPage() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [error, setError] = useState<unknown>(null);

  async function load() {
    setClasses(await api<ClassGroup[]>("/api/classes", {}, token));
  }

  useEffect(() => {
    if (token) load().catch(setError);
  }, [token]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api("/api/classes", { method: "POST", body: JSON.stringify({ name }) }, token);
      setName("");
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function enroll(classId: number) {
    setError(null);
    try {
      await api(`/api/classes/${classId}/enroll`, { method: "POST", body: JSON.stringify({ email: emails[classId] || "" }) }, token);
      setEmails((current) => ({ ...current, [classId]: "" }));
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  async function rename(classGroup: ClassGroup) {
    const next = window.prompt("Class name", classGroup.name);
    if (!next) return;
    await api(`/api/classes/${classGroup.id}`, { method: "PUT", body: JSON.stringify({ name: next }) }, token);
    await load();
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this class?")) return;
    await api(`/api/classes/${id}`, { method: "DELETE" }, token);
    await load();
  }

  return (
    <>
      <h1 className="font-serif text-4xl">Classes</h1>
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Field label="New class">
              <input className={inputClass()} value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Card>
      {classes.map((classGroup) => (
        <Card key={classGroup.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{classGroup.name}</h2>
              <p className="text-sm text-ink/60">Join code <span className="font-semibold text-pine">{classGroup.joinCode}</span></p>
            </div>
            <div className="flex gap-2">
              <Button tone="ghost" onClick={() => rename(classGroup)}>Rename</Button>
              <Button tone="danger" onClick={() => remove(classGroup.id)}>Delete</Button>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {classGroup.students.length === 0 ? <li className="text-ink/50">No students yet.</li> : classGroup.students.map((student) => (
              <li key={student.id}>{student.name} · {student.email}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <input className={`${inputClass()} max-w-sm`} placeholder="student@email" value={emails[classGroup.id] || ""} onChange={(event) => setEmails((current) => ({ ...current, [classGroup.id]: event.target.value }))} />
            <Button onClick={() => enroll(classGroup.id)}>Enroll</Button>
          </div>
        </Card>
      ))}
    </>
  );
}
