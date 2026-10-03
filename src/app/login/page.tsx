"use client";

import { Anchor, Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Field, TextInput } from "../../components/ui";
import { api, errorMessage, fieldError } from "../../lib/api";
import { homeFor, useAuth } from "../../lib/auth";
import type { AuthResponse } from "../../lib/types";

const demos = [
  { label: "Admin", email: "admin@testpoint.local", password: "Admin@123" },
  { label: "Instructor", email: "instructor@testpoint.local", password: "Instructor@123" },
  { label: "Student", email: "student1@testpoint.local", password: "Student@123" },
];

export default function LoginPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session = await api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(session);
      router.push(homeFor(session.user.role));
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  return (
    <Center mih="100vh" bg="gray.0" p="md">
      <Stack w="100%" maw={420} gap="lg">
        <Anchor component={Link} href="/" fw={700} size="lg" c="dark" underline="never">TestPoint</Anchor>
        <Paper withBorder p="xl" radius="md" shadow="sm" bg="white">
          <Title order={2}>Sign in</Title>
          <form onSubmit={onSubmit}>
            <Stack mt="lg" gap="md">
              {error ? <Alert>{errorMessage(error)}</Alert> : null}
              <Field label="Email" error={fieldError(error, "email")}>
                <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </Field>
              <Field label="Password" error={fieldError(error, "password")}>
                <TextInput type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
              <Button type="submit" loading={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
            </Stack>
          </form>
          <Stack mt="lg" gap="xs">
            <Text size="sm" c="dimmed">Demo accounts</Text>
            <Group gap="xs">
              {demos.map((demo) => (
                <Button key={demo.email} variant="default" size="xs" onClick={() => { setEmail(demo.email); setPassword(demo.password); }}>
                  {demo.label}
                </Button>
              ))}
            </Group>
          </Stack>
          <Text mt="lg" size="sm">
            No account yet? <Anchor component={Link} href="/register">Register</Anchor>
          </Text>
        </Paper>
      </Stack>
    </Center>
  );
}
