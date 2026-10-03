"use client";

import { Button, Container, Group, List, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
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
    <Stack mih="100vh" bg="gray.0" gap={0}>
      <Group h={60} px="lg" justify="space-between" bg="white" style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        <Title order={4}>TestPoint</Title>
        <Group gap="sm">
          <Button component={Link} href="/login" variant="default" size="sm">Sign in</Button>
          <Button component={Link} href="/register" size="sm">Create an account</Button>
        </Group>
      </Group>
      <Container size="lg" py={72}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
          <Stack gap="md" justify="center">
            <Text size="sm" fw={700} tt="uppercase" c="blue">Online quiz portal</Text>
            <Title order={1}>Set, sit, and grade timed quizzes.</Title>
            <Text size="lg" c="dimmed" maw={560}>
              Instructors build a question bank, schedule a timed quiz, and review short answers. Students sit the paper, see objective scores immediately, and keep a record of every attempt.
            </Text>
            <Group>
              <Button component={Link} href="/login">Sign in</Button>
              <Button component={Link} href="/register" variant="default">Create an account</Button>
            </Group>
          </Stack>
          <Paper withBorder p="lg" radius="md" shadow="xs" bg="white">
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">Sample paper</Text>
            <Title order={3} mt={4}>Spring Boot basics</Title>
            <List mt="lg" spacing="sm">
              <List.Item>Which layer owns the scoring rules?</List.Item>
              <List.Item>Spring Data repositories are interfaces. True or false.</List.Item>
              <List.Item>Why stay quiet about the answer key until submit?</List.Item>
            </List>
            <Text mt="lg" size="sm" c="blue">20 minutes · mixed questions · instant objective score</Text>
          </Paper>
        </SimpleGrid>
      </Container>
    </Stack>
  );
}
