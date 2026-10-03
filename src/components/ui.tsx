"use client";

import {
  Alert as MantineAlert,
  Button as MantineButton,
  Checkbox as MantineCheckbox,
  Group,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput as MantineTextInput,
  Title,
} from "@mantine/core";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Paper withBorder p="md" radius="md" shadow="xs" bg="white" className={className}>
      {children}
    </Paper>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" wrap="wrap">
      <div>
        <Title order={2}>{title}</Title>
        {description ? <Text size="sm" c="dimmed" mt={4}>{description}</Text> : null}
      </div>
      {action}
    </Group>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper withBorder p="md" radius="md" shadow="xs" bg="white">
      <Text size="xs" tt="uppercase" fw={600} c="dimmed">{label}</Text>
      <Title order={2} mt={6}>{value}</Title>
    </Paper>
  );
}

export function Button({
  children,
  type = "button",
  tone = "primary",
  disabled,
  onClick,
  href,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const shared = {
    disabled,
    size: "sm" as const,
    variant: tone === "ghost" ? "default" as const : "filled" as const,
    color: tone === "danger" ? "red" : tone === "ghost" ? undefined : "blue",
  };

  if (href) {
    return (
      <MantineButton component={Link} href={href} {...shared}>
        {children}
      </MantineButton>
    );
  }

  return (
    <MantineButton type={type} onClick={onClick} {...shared}>
      {children}
    </MantineButton>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>{label}</Text>
      {children}
      {error ? <Text size="xs" c="red">{error}</Text> : null}
    </Stack>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <MantineAlert color="red" variant="light">
      {children}
    </MantineAlert>
  );
}

export function TextInput(props: ComponentProps<typeof MantineTextInput>) {
  return <MantineTextInput size="sm" {...props} />;
}

export function Area({ rows = 2, ...props }: ComponentProps<typeof Textarea> & { rows?: number }) {
  return <Textarea size="sm" autosize minRows={rows} {...props} />;
}

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select
      size="sm"
      value={value || null}
      onChange={(next) => {
        if (next) onValueChange(next);
      }}
      data={options}
      placeholder={placeholder}
      allowDeselect={false}
    />
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return <MantineCheckbox checked={checked} onChange={(event) => onCheckedChange(event.currentTarget.checked)} />;
}

export function ChoiceGroup({
  name,
  value,
  onValueChange,
  options,
}: {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Radio.Group name={name} value={value} onChange={onValueChange}>
      <Stack gap="xs" mt="xs">
        {options.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} />
        ))}
      </Stack>
    </Radio.Group>
  );
}
