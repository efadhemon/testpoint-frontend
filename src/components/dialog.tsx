"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

const widths = {
  sm: "w-[min(100%-2rem,28rem)]",
  md: "w-[min(100%-2rem,40rem)]",
  lg: "w-[min(100%-2rem,56rem)]",
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content className={`fixed left-1/2 top-1/2 z-50 max-h-[min(100%-2rem,44rem)] ${widths[width]} -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-card p-5 shadow-lg outline-none`}>
          <Dialog.Title className="font-serif text-2xl">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-2 text-sm text-ink/70">{description}</Dialog.Description> : null}
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
