"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "tcms-sidebar-color";
const DEFAULT_SIDEBAR_COLOR = "#111827";

interface ThemeContextValue {
  sidebarColor: string;
  setSidebarColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function paintSidebar(color: string) {
  document.documentElement.style.setProperty("--bg-sidebar", color);
}

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
  const [sidebarColor, setSidebarColorState] = useState(DEFAULT_SIDEBAR_COLOR);

  // Restore a previously saved color once the client mounts — SSR has no
  // localStorage/window, so this stays a no-op during the server render and
  // the page first paints with the CSS default, exactly like a fresh visitor.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      paintSidebar(stored);
      setSidebarColorState(stored);
    }
  }, []);

  const setSidebarColor = (color: string) => {
    paintSidebar(color);
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
