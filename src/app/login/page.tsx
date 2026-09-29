"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Alert, Button, Field, inputClass } from "../../components/ui";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link href="/" className="font-serif text-3xl">TestPoint</Link>
      <h1 className="mt-6 font-serif text-4xl">Sign in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <Field label="Email" error={fieldError(error, "email")}>
          <input className={inputClass()} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="Password" error={fieldError(error, "password")}>
          <input className={inputClass()} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </Field>
        <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
      </form>
      <div className="mt-6 space-y-2">
        <p className="text-sm text-ink/60">Demo accounts</p>
        <div className="flex flex-wrap gap-2">
          {demos.map((demo) => (
            <button key={demo.email} className="rounded-full border border-line bg-card px-3 py-1 text-sm" onClick={() => { setEmail(demo.email); setPassword(demo.password); }}>
              {demo.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 text-sm">No account yet? <Link href="/register" className="font-semibold text-pine">Register</Link></p>
    </main>
  );
}
