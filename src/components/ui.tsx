import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(28,25,21,0.04)] ${className}`}>{children}</section>;
}

export function Button({
  children,
  type = "button",
  tone = "primary",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    primary: "bg-pine text-paper hover:bg-pine/90",
    ghost: "border border-line bg-card hover:bg-moss",
    danger: "bg-copper text-white hover:bg-copper/90",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      {children}
      {error ? <span className="block text-copper">{error}</span> : null}
    </label>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-copper/30 bg-copper/10 px-3 py-2 text-sm text-copper">{children}</p>;
}

export function inputClass() {
  return "w-full rounded-xl border border-line bg-paper px-3 py-2 outline-none ring-pine focus:ring-2";
}
