export class ApiError extends Error {
  status: number;
  field: string | null;
  errors: { field: string; message: string }[];

  constructor(message: string, status: number, field: string | null, errors: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.field = field;
    this.errors = errors;
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (response.status === 204) {
    return undefined as T;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errors = Array.isArray(data.errors) ? data.errors : [];
    throw new ApiError(data.message || "Request failed", response.status, data.field ?? null, errors);
  }
  return data as T;
}

export function fieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) return undefined;
  return error.errors.find((item) => item.field === field)?.message || (error.field === field ? error.message : undefined);
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
