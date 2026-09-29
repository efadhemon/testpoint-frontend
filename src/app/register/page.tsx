"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Field, inputClass } from "../../components/ui";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="font-serif text-3xl">TestPoint</Link>
      <h1 className="mt-6 font-serif text-4xl">Create an account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <Field label="Name" error={fieldError(error, "name")}>
          <input className={inputClass()} value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label="Email" error={fieldError(error, "email")}>
          <input className={inputClass()} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Password" error={fieldError(error, "password")}>
          <input className={inputClass()} type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Field label="I am a" error={fieldError(error, "role")}>
          <select className={inputClass()} value={role} onChange={(event) => setRole(event.target.value as Exclude<Role, "ADMIN">)}>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select>
        </Field>
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-sm">Already registered? <Link href="/login" className="font-semibold text-pine">Sign in</Link></p>
    </main>
  );
}
