"use client";

import { Modal as MantineModal, Text } from "@mantine/core";
import type { ReactNode } from "react";

const widths = {
  sm: "28rem",
  md: "40rem",
  lg: "56rem",
} as const;

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  width = "sm",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  width?: keyof typeof widths;
  children: ReactNode;
}) {
  return (
    <MantineModal opened={open} onClose={() => onOpenChange(false)} title={title} size={widths[width]} centered>
      {description ? <Text size="sm" c="dimmed" mb="md">{description}</Text> : null}
      {children}
    </MantineModal>
  );
}
