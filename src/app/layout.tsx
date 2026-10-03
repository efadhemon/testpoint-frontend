import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TestPoint",
  description: "Create, take, and grade timed quizzes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="min-h-full">
        <MantineProvider
          defaultColorScheme="light"
          theme={{
            primaryColor: "blue",
            fontFamily: "var(--font-figtree), sans-serif",
            headings: { fontFamily: "var(--font-figtree), sans-serif" },
          }}
        >
          <AuthProvider>{children}</AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
