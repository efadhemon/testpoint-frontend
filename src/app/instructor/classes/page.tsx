"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
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
  const [renaming, setRenaming] = useState<ClassGroup | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<ClassGroup | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchClasses = useCallback(
    () => api<ClassGroup[]>("/api/classes", {}, token),
    [token],
  );

  async function load() {
    setClasses(await fetchClasses());
  }

  useEffect(() => {
    if (!token) return;
    fetchClasses().then(setClasses).catch(setError);
  }, [token, fetchClasses]);

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

  function openRename(classGroup: ClassGroup) {
    setRenaming(classGroup);
    setRenameValue(classGroup.name);
  }

  async function rename(event: FormEvent) {
    event.preventDefault();
    if (!renaming) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/classes/${renaming.id}`, { method: "PUT", body: JSON.stringify({ name: renameValue.trim() }) }, token);
      setRenaming(null);
      await load();
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/classes/${deleting.id}`, { method: "DELETE" }, token);
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
              <Button tone="ghost" onClick={() => openRename(classGroup)}>Rename</Button>
              <Button tone="danger" onClick={() => setDeleting(classGroup)}>Delete</Button>
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
      <Modal
        open={renaming !== null}
        onOpenChange={(open) => { if (!open) setRenaming(null); }}
        title="Rename class"
        description={renaming ? `Update the name for ${renaming.name}.` : undefined}
      >
        <form onSubmit={rename} className="space-y-4">
          <Field label="Class name">
            <input className={inputClass()} value={renameValue} onChange={(event) => setRenameValue(event.target.value)} required autoFocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button tone="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button type="submit" disabled={busy || renameValue.trim().length === 0}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete class"
        description={deleting ? `${deleting.name} and its enrollments will be removed. Assigned quizzes stay in your list.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </div>
      </Modal>
    </>
  );
}
