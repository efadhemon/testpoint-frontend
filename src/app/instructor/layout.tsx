"use client";

import { Shell } from "../../components/Shell";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return <Shell role="INSTRUCTOR">{children}</Shell>;
}
