"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div>
      {/* Desktop sidebar — fixed position, full viewport height, doesn't scroll with content */}
      <Sidebar className="fixed inset-y-0 left-0 hidden h-screen w-[220px] md:flex" />

      {/* Mobile drawer — already an independent fixed overlay, unaffected by the desktop layout */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 h-full w-64 max-w-[80%] shadow-xl">
            <button
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-none p-1 text-sidebar-ink hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Content column — offset past the fixed sidebar's width on desktop, and
          scrolls independently of it (the sidebar is never inside this container) */}
      <div className="flex h-screen flex-col overflow-y-auto bg-surface md:ml-[220px]">
        <header className="flex items-center gap-3 border-b border-border bg-card p-4 text-ink md:hidden">
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-none p-1 hover:bg-border/50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold tracking-wide">TENDER-CMS</span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
