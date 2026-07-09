"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "tcms-sidebar-color";
const DEFAULT_SIDEBAR_COLOR = "#111827";

function readStoredSidebarColor(): string {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_COLOR;
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SIDEBAR_COLOR;
}

interface ThemeContextValue {
  sidebarColor: string;
  setSidebarColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Owns the one runtime-configurable design token — the sidebar background —
 * by writing straight to the `--bg-sidebar` CSS custom property that
 * globals.css's `bg-sidebar` Tailwind utility resolves through. Every
 * consumer of `bg-sidebar` (AdminSidebar, StaffSidebar, on both portals)
 * repaints the instant this changes; no color prop needs to be threaded
 * through either sidebar tree.
 *
 * Mounted once in the root layout so it wraps both the (admin) and (staff)
 * route groups — the "both Admin and Staff sides" requirement is satisfied
 * by mounting position, not by any per-portal code.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy initializer, not an effect: reads localStorage once, synchronously,
  // the first time this runs in the browser — no flash-of-default-then-correct,
  // and no setState-inside-useEffect (SSR/hydration is unaffected since this
  // component's own JSX never renders `sidebarColor` into the DOM itself).
  const [sidebarColor, setSidebarColorState] = useState(readStoredSidebarColor);

  // Pure DOM sync — not a setState call, so this is exactly what an effect is for.
  useEffect(() => {
    document.documentElement.style.setProperty("--bg-sidebar", sidebarColor);
  }, [sidebarColor]);

  const setSidebarColor = (color: string) => {
    setSidebarColorState(color);
    // TODO: PATCH /api/system-config once that route exists — for now this is
    // the only persistence layer available (UI-only mock phase, AGENTS.md).
    window.localStorage.setItem(STORAGE_KEY, color);
  };

  return <ThemeContext.Provider value={{ sidebarColor, setSidebarColor }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
