import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";
import "./dark-fixes.css";
import "./footer-layout.css";

export const metadata: Metadata = {
  title: "Verity Study — Evidence-first learning",
  description: "A multimodal study workspace for grounded answers, traceable evidence, summaries, comparisons, and quizzes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <div className="fixed right-4 top-[84px] z-50 sm:right-6" aria-label="Appearance controls">
            <ThemeToggle />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
