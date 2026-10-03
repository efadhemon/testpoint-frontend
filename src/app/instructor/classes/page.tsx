"use client";

import { Badge, Group, Stack, Table, Text } from "@mantine/core";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Modal } from "../../../components/dialog";
import { Alert, Button, Card, Field, PageHeader, TextInput } from "../../../components/ui";
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
      <PageHeader title="Classes" description="Create a class, share the join code, and enroll students." />
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <form onSubmit={create}>
          <Group align="flex-end">
            <Field label="New class">
              <TextInput value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Button type="submit">Create</Button>
          </Group>
        </form>
      </Card>
      {classes.length > 0 ? (
        <Table.ScrollContainer minWidth={860}>
          <Table striped highlightOnHover withTableBorder bg="white" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Class</Table.Th>
                <Table.Th>Join code</Table.Th>
                <Table.Th>Students</Table.Th>
                <Table.Th>Enroll</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {classes.map((classGroup) => (
                <Table.Tr key={classGroup.id}>
                  <Table.Td><Text fw={600}>{classGroup.name}</Text></Table.Td>
                  <Table.Td><Badge variant="light">{classGroup.joinCode}</Badge></Table.Td>
                  <Table.Td maw={280}>
                    {classGroup.students.length === 0 ? <Text size="sm" c="dimmed">No students yet.</Text> : (
                      <Stack gap={2}>
                        {classGroup.students.map((student) => (
                          <Text key={student.id} size="sm">{student.name} · {student.email}</Text>
                        ))}
                      </Stack>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group wrap="nowrap">
                      <TextInput placeholder="student@email" value={emails[classGroup.id] || ""} onChange={(event) => setEmails((current) => ({ ...current, [classGroup.id]: event.target.value }))} />
                      <Button onClick={() => enroll(classGroup.id)}>Enroll</Button>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap" justify="flex-end">
                      <Button tone="ghost" onClick={() => openRename(classGroup)}>Rename</Button>
                      <Button tone="danger" onClick={() => setDeleting(classGroup)}>Delete</Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : null}
      <Modal
        open={renaming !== null}
        onOpenChange={(open) => { if (!open) setRenaming(null); }}
        title="Rename class"
        description={renaming ? `Update the name for ${renaming.name}.` : undefined}
      >
        <form onSubmit={rename}>
          <Stack gap="md">
            <Field label="Class name">
              <TextInput value={renameValue} onChange={(event) => setRenameValue(event.target.value)} required autoFocus />
            </Field>
            <Group justify="flex-end">
              <Button tone="ghost" onClick={() => setRenaming(null)}>Cancel</Button>
              <Button type="submit" disabled={busy || renameValue.trim().length === 0}>{busy ? "Saving…" : "Save"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete class"
        description={deleting ? `${deleting.name} and its enrollments will be removed. Assigned quizzes stay in your list.` : undefined}
      >
        <Group justify="flex-end">
          <Button tone="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button tone="danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete"}</Button>
        </Group>
      </Modal>
    </>
  );
}
