"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, useAuth } from "../lib/auth";

export default function HomePage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role));
  }, [ready, user, router]);

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Online quiz portal</p>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight">A quieter way to set and sit a test.</h1>
        <p className="max-w-xl text-lg text-ink/75">
          Instructors build a question bank, schedule a timed quiz, and review short answers. Students sit the paper, see objective scores immediately, and keep a record of every attempt.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-paper">Sign in</Link>
          <Link href="/register" className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-semibold">Create an account</Link>
        </div>
      </div>
      <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-ink/50">Sample paper</p>
        <h2 className="mt-2 font-serif text-3xl">Spring Boot basics</h2>
        <ol className="mt-6 space-y-4 text-sm">
          <li className="border-t border-line pt-4">1. Which layer owns the scoring rules?</li>
          <li className="border-t border-line pt-4">2. Spring Data repositories are interfaces. True or false.</li>
          <li className="border-t border-line pt-4">3. Why stay quiet about the answer key until submit?</li>
        </ol>
        <p className="mt-6 text-sm text-pine">20 minutes · mixed questions · instant objective score</p>
      </div>
    </main>
  );
}
