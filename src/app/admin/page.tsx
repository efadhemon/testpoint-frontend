"use client";

import { Badge, Group, SimpleGrid, Table, Text } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "../../components/Shell";
import { Alert, Button, PageHeader, SelectField, Stat } from "../../components/ui";
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

  const fetchDesk = useCallback(
    () => Promise.all([
      api<User[]>("/api/admin/users", {}, token),
      api<AdminStats>("/api/admin/stats", {}, token),
    ]),
    [token],
  );

  async function load() {
    const [people, counts] = await fetchDesk();
    setUsers(people);
    setStats(counts);
  }

  useEffect(() => {
    if (!token) return;
    fetchDesk().then(([people, counts]) => {
      setUsers(people);
      setStats(counts);
    }).catch(setError);
  }, [token, fetchDesk]);

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
      <PageHeader title="People" description="Roles, access, and activity across the portal." />
      {stats ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <Stat label="Users" value={stats.users} />
          <Stat label="Instructors" value={stats.instructors} />
          <Stat label="Students" value={stats.students} />
          <Stat label="Attempts" value={stats.attempts} />
        </SimpleGrid>
      ) : null}
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <Table.ScrollContainer minWidth={720}>
        <Table striped highlightOnHover withTableBorder bg="white">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}><Text size="sm" c="dimmed">No users yet.</Text></Table.Td>
              </Table.Tr>
            ) : users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.name}</Table.Td>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <SelectField
                    value={user.role}
                    onValueChange={(role) => update(user.id, { role: role as Role })}
                    options={[
                      { value: "ADMIN", label: "Admin" },
                      { value: "INSTRUCTOR", label: "Instructor" },
                      { value: "STUDENT", label: "Student" },
                    ]}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Badge variant="light" color={user.enabled ? "blue" : "gray"}>{user.enabled ? "Enabled" : "Disabled"}</Badge>
                    <Button tone="ghost" onClick={() => update(user.id, { enabled: !user.enabled })}>
                      {user.enabled ? "Disable" : "Enable"}
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}
