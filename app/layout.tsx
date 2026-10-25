import type { Metadata } from "next";

import "./globals.css";
import "./workspace.css";
import "./document-reader.css";

export const metadata: Metadata = {
  title: "Verity Study — Evidence-first learning",
  description:
    "A multimodal study workspace for grounded answers, traceable evidence, summaries, comparisons, and quizzes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
