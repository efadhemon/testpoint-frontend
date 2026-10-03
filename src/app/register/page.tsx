"use client";

import { Anchor, Button, Center, Paper, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Field, SelectField, TextInput } from "../../components/ui";
import { api, errorMessage, fieldError } from "../../lib/api";
import { homeFor, useAuth } from "../../lib/auth";
import type { AuthResponse, Role } from "../../lib/types";

export default function RegisterPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<Role, "ADMIN">>("STUDENT");
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const session = await api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
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
          <Title order={2}>Create an account</Title>
          <form onSubmit={onSubmit}>
            <Stack mt="lg" gap="md">
              {error ? <Alert>{errorMessage(error)}</Alert> : null}
              <Field label="Name" error={fieldError(error, "name")}>
                <TextInput value={name} onChange={(event) => setName(event.target.value)} required />
              </Field>
              <Field label="Email" error={fieldError(error, "email")}>
                <TextInput type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </Field>
              <Field label="Password" error={fieldError(error, "password")}>
                <TextInput type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
              <Field label="I am a" error={fieldError(error, "role")}>
                <SelectField
                  value={role}
                  onValueChange={(value) => setRole(value as Exclude<Role, "ADMIN">)}
                  options={[{ value: "STUDENT", label: "Student" }, { value: "INSTRUCTOR", label: "Instructor" }]}
                />
              </Field>
              <Button type="submit" loading={pending}>{pending ? "Creating…" : "Create account"}</Button>
            </Stack>
          </form>
          <Text mt="lg" size="sm">
            Already registered? <Anchor component={Link} href="/login">Sign in</Anchor>
          </Text>
        </Paper>
      </Stack>
    </Center>
  );
}
