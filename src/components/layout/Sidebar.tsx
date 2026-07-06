"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface NavGroup {
  label: string;
  href?: string;
  children?: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Price Schedules",
    children: [
      { label: "Create", href: "/tenders/create" },
      { label: "History", href: "/tenders/history" },
    ],
  },
  {
    label: "Job Orders",
    children: [
      { label: "Create", href: "/job-orders/create" },
      { label: "Active", href: "/job-orders/active" },
      { label: "History", href: "/job-orders/history" },
    ],
  },
  {
    label: "Commissions",
    children: [
      { label: "Pending", href: "/commissions/pending" },
      { label: "History", href: "/commissions/history" },
    ],
  },
  {
    label: "Other Expenses",
    children: [
      { label: "Create", href: "/expenses/create" },
      { label: "History", href: "/expenses/history" },
    ],
  },
  {
    label: "System Configs",
    children: [
      { label: "Users · Create", href: "/users/create" },
      { label: "Users · List", href: "/users" },
    ],
  },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      if (group.children?.some((link) => link.href === pathname)) {
        initial[group.label] = true;
      }
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className={`flex h-full flex-col bg-sidebar text-sidebar-ink ${className}`}>
      <div className="p-4">
        <div className="rounded-md border border-white/10 py-2 text-center text-sm font-bold tracking-wide">
          TENDER-CMS
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 text-sm">
        {NAV_GROUPS.map((group) => {
          if (!group.children) {
            const isActive = pathname === group.href;
            return (
              <Link
                key={group.label}
                href={group.href ?? "#"}
                onClick={onNavigate}
                className={`block rounded-md px-3 py-2 font-semibold transition-colors ${
                  isActive
                    ? "bg-active text-active-ink"
                    : "text-sidebar-ink/90 hover:bg-white/5"
                }`}
              >
                {group.label}
              </Link>
            );
          }

          const isOpen = !!openGroups[group.label];

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 font-semibold text-sidebar-ink/90 hover:bg-white/5"
              >
                {group.label}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
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
                  <div className="mt-1 space-y-0.5 py-1 pl-3">
                    {group.children.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onNavigate}
                          className={`block rounded-md px-2 py-1 ${
                            isActive
                              ? "bg-sidebar-active font-medium text-sidebar-active-ink"
                              : "text-sidebar-muted hover:text-sidebar-ink"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-white/10 p-4">
        <div className="h-8 w-8 rounded-full bg-white/10" />
        <div className="text-sm">
          <p className="font-semibold">Nimal</p>
          <p className="text-xs text-sidebar-muted">Admin</p>
        </div>
      </div>
    </div>
  );
}
