import { api } from "./api";
import type { Page, Question } from "./types";

const BANK_PAGE_SIZE = 100;

export async function fetchAllQuestions(token?: string | null): Promise<Question[]> {
  const first = await api<Page<Question>>(`/api/questions?page=0&size=${BANK_PAGE_SIZE}`, {}, token);
  if (first.totalPages <= 1) {
    return first.content;
  }
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      api<Page<Question>>(`/api/questions?page=${index + 1}&size=${BANK_PAGE_SIZE}`, {}, token),
    ),
  );
  return [first, ...rest].flatMap((page) => page.content);
}
