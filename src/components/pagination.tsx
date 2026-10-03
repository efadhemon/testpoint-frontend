"use client";

import { Group, Pagination as MantinePagination, Text } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export function usePaginationParams(defaultSize: number) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawPage = Number(params.get("page"));
  const rawSize = Number(params.get("size"));
  const displayPage = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const size = Number.isInteger(rawSize) && rawSize >= 1 && rawSize <= 100 ? rawSize : defaultSize;

  const write = useCallback((page: number, nextSize: number, mode: "push" | "replace") => {
    const query = new URLSearchParams(params.toString());
    query.set("page", String(page));
    query.set("size", String(nextSize));
    const href = `${pathname}?${query.toString()}`;
    if (mode === "replace") router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }, [params, pathname, router]);

  useEffect(() => {
    if (params.get("page") === String(displayPage) && params.get("size") === String(size)) return;
    write(displayPage, size, "replace");
  }, [params, displayPage, size, write]);

  return {
    page: displayPage - 1,
    size,
    setPage: (index: number) => write(Math.max(0, index) + 1, size, "push"),
  };
}

export function Pagination({
  page,
  size,
  total,
  onPageChange,
}: {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / size);
  if (totalPages <= 1) return null;
  const start = page * size + 1;
  const end = Math.min(total, (page + 1) * size);

  return (
    <Group justify="space-between" align="center">
      <Text size="sm" c="dimmed">{start}–{end} of {total}</Text>
      <MantinePagination total={totalPages} value={page + 1} onChange={(value) => onPageChange(value - 1)} />
    </Group>
  );
}
