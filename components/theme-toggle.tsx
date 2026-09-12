"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Toggle } from "@/components/ui/toggle";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <span aria-hidden="true" className="size-10 rounded-xl border border-line bg-card" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Toggle
      variant="outline"
      size="lg"
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      className="size-10 rounded-xl border-line bg-card text-ink-muted shadow-none hover:bg-accent hover:text-ink data-[state=on]:bg-card data-[state=on]:text-cyan-light"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Toggle>
  );
}
