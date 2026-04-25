"use client";
// Toggle de modo claro/oscuro con next-themes.
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ToggleTema() {
  const { theme, setTheme, resolvedTheme } = useTheme() ?? {};
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const actual = mounted ? resolvedTheme ?? theme : undefined;
  const esOscuro = actual === "dark";

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      title="Cambiar tema (claro / oscuro)"
      onClick={() => setTheme?.(esOscuro ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card hover:bg-accent transition"
    >
      {mounted ? (
        esOscuro ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
