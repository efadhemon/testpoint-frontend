"use client";

import { AppShell, Burger, Button, Group, NavLink, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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
  const [opened, { toggle, close }] = useDisclosure();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user.role));
  }, [ready, user, role, router]);

  if (!ready || !user || user.role !== role) {
    return (
      <Group justify="center" mih="100vh">
        <Text c="dimmed" size="sm">Opening your desk…</Text>
      </Group>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="lg"
      styles={{
        main: { background: "var(--mantine-color-gray-0)" },
        navbar: {
          background: "white",
          borderRight: "1px solid var(--mantine-color-gray-2)",
        },
        header: {
          background: "white",
          borderBottom: "1px solid var(--mantine-color-gray-2)",
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Open navigation" />
            <Text component={Link} href={homeFor(role)} fw={700} size="lg" c="dark" td="none">
              TestPoint
            </Text>
          </Group>
          <Group gap="sm">
            <Text size="sm">{user.name}</Text>
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack gap={4}>
          {links[role].map((link) => {
            const active = pathname === link.href;
            return (
              <NavLink
                key={link.href}
                component={Link}
                href={link.href}
                label={link.label}
                active={active}
                onClick={close}
                variant="light"
                color="blue"
                styles={{
                  root: { borderRadius: "var(--mantine-radius-sm)" },
                }}
              />
            );
          })}
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Stack gap="md">{children}</Stack>
      </AppShell.Main>
    </AppShell>
  );
}
