"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

interface SidebarAccordionProps {
  label: string;
  /** hrefs of the items rendered in `children`, used to auto-open and highlight this group when one of them is active. */
  childHrefs: string[];
  children: ReactNode;
}

/**
 * Client Component — the only piece of a menu group that needs state
 * (expanded/collapsed). SidebarGroup (Server Component) passes the already
 * server-rendered child links in as `children`.
 */
export function SidebarAccordion({ label, childHrefs, children }: SidebarAccordionProps) {
  const pathname = usePathname();
  const hasActiveChild = childHrefs.includes(pathname);

  // Collapsed by default, except when the active route lives in this group.
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-2 rounded-none px-3 py-2 font-semibold transition-colors ${
          hasActiveChild ? "bg-white/5 text-sidebar-ink" : "text-sidebar-ink/90 hover:bg-white/5"
        }`}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-0" : "-rotate-90"}`}
          aria-hidden
        />
      </button>

      {/* CSS-grid collapse trick: animates height without measuring content */}
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-0.5 py-1 pl-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
