"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, useAuth } from "../lib/auth";
import type { Role } from "../lib/types";

const links: Record<Role, { href: string; label: string }[]> = {
  ADMIN: [{ href: "/admin", label: "People" }],
  INSTRUCTOR: [
    { href: "/instructor", label: "Overview" },
    { href: "/instructor/classes", label: "Classes" },
    { href: "/instructor/questions", label: "Question bank" },
    { href: "/instructor/questions/generate", label: "From a PDF" },
    { href: "/instructor/quizzes", label: "Quizzes" },
    { href: "/instructor/grading", label: "Grading" },
  ],
  STUDENT: [
    { href: "/student", label: "Quizzes" },
    { href: "/student/history", label: "History" },
  ],
};

export function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user.role));
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) {
    return <p className="p-8 text-sm text-ink/60">Opening your desk…</p>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href={homeFor(role)} className="font-serif text-2xl tracking-tight">
            TestPoint
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/70">
              {user.name}
              <span className="ml-2 rounded-full bg-moss px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-pine">{user.role.toLowerCase()}</span>
            </span>
            <button className="rounded-full border border-line px-3 py-1" onClick={() => { logout(); router.push("/"); }}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[190px_1fr]">
        <nav className="flex gap-2 overflow-auto md:flex-col">
          {links[role].map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`rounded-full px-3 py-2 text-sm ${active ? "bg-pine text-paper" : "hover:bg-moss"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <main className="space-y-5">{children}</main>
      </div>
    </div>
  );
}
