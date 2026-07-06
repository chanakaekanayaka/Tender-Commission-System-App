"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MobileNavContext } from "@/components/layout/mobile-nav-context";

interface DashboardLayoutProps {
  /** Pre-rendered Server Component output (see the (admin)/(staff) layouts) — kept out of the client bundle. */
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * Shared shell for both the admin and staff areas. The only client-side
 * concern here is the mobile drawer toggle — the sidebar itself (passed in
 * as a prop) stays a Server Component tree.
 */
export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ close: () => setMobileOpen(false) }}>
      <div>
        {/* Desktop sidebar — fixed position, full viewport height, doesn't scroll with content */}
        <div className="fixed inset-y-0 left-0 hidden h-screen w-[220px] md:block">{sidebar}</div>

        {/* Mobile drawer — independent fixed overlay, unaffected by the desktop layout */}
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
              {sidebar}
            </div>
          </div>
        )}

        {/* Content column — offset past the fixed sidebar's width on desktop, scrolls independently of it */}
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
    </MobileNavContext.Provider>
  );
}
