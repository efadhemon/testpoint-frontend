export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

export function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function percent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}
