"use client";

import { useEffect, useState } from "react";
import { Shell } from "../../components/Shell";
import { Alert, Card } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AdminStats, Role, User } from "../../lib/types";

export default function AdminPage() {
  return (
    <Shell role="ADMIN">
      <AdminDesk />
    </Shell>
  );
}

function AdminDesk() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function load() {
    const [people, counts] = await Promise.all([
      api<User[]>("/api/admin/users", {}, token),
      api<AdminStats>("/api/admin/stats", {}, token),
    ]);
    setUsers(people);
    setStats(counts);
  }

  useEffect(() => {
    if (!token) return;
    load().catch(setError);
  }, [token]);

  async function update(id: number, body: { role?: Role; enabled?: boolean }) {
    setError(null);
    try {
      await api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token);
      await load();
    } catch (caught) {
      setError(caught);
    }
  }

  return (
    <>
      <h1 className="font-serif text-4xl">People</h1>
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Users" value={stats.users} />
          <Stat label="Instructors" value={stats.instructors} />
          <Stat label="Students" value={stats.students} />
          <Stat label="Attempts" value={stats.attempts} />
        </div>
      ) : null}
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Card>
        <table className="w-full text-left text-sm">
          <thead className="text-ink/50">
            <tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="py-3">{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select className="rounded-lg border border-line bg-paper px-2 py-1" value={user.role} onChange={(event) => update(user.id, { role: event.target.value as Role })}>
                    <option value="ADMIN">Admin</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </td>
                <td>
                  <button className="text-pine" onClick={() => update(user.id, { enabled: !user.enabled })}>
                    {user.enabled ? "Enabled" : "Disabled"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <Card><p className="text-xs uppercase tracking-wide text-ink/50">{label}</p><p className="font-serif text-3xl">{value}</p></Card>;
}
