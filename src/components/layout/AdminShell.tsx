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
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      {/* Desktop sidebar — fixed column */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile drawer */}
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
              className="absolute top-4 right-3 rounded-md p-1 text-sidebar-ink hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card p-4 text-ink md:hidden">
          <button
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1 hover:bg-border/50"
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
