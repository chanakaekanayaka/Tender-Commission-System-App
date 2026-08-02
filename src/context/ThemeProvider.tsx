"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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
 * `initialColor` comes from the real SystemConfig document (see RootLayout),
 * not localStorage — every session, on any browser, starts from the same
 * persisted value instead of whichever browser last set it locally.
 * `setSidebarColor` only updates this client-side state for the instant
 * repaint; the actual PATCH /api/system-config that persists a new color is
 * SystemConfig's own concern.
 *
 * Mounted once in the root layout so it wraps both the (admin) and (staff)
 * route groups — the "both Admin and Staff sides" requirement is satisfied
 * by mounting position, not by any per-portal code.
 */
export function ThemeProvider({ initialColor, children }: { initialColor: string; children: ReactNode }) {
  const [sidebarColor, setSidebarColor] = useState(initialColor);

  // Pure DOM sync — not a setState call, so this is exactly what an effect is for.
  useEffect(() => {
    document.documentElement.style.setProperty("--bg-sidebar", sidebarColor);
  }, [sidebarColor]);

  return <ThemeContext.Provider value={{ sidebarColor, setSidebarColor }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
