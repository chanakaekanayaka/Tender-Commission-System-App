"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCloseMobileNav } from "@/components/layout/mobile-nav-context";

interface SidebarItemProps {
  href: string;
  label: string;
  /** "top" for a standalone top-level link (e.g. Dashboard), "child" for a link nested under a group. */
  variant?: "top" | "child";
}

const VARIANT_CLASSES = {
  top: {
    base: "block rounded-none px-3 py-2 font-semibold transition-colors",
    active: "bg-active text-active-ink",
    inactive: "text-sidebar-ink/90 hover:bg-white/5",
  },
  child: {
    base: "block rounded-none px-2 py-1 transition-colors",
    active: "bg-sidebar-active font-medium text-sidebar-active-ink",
    inactive: "text-sidebar-muted hover:text-sidebar-ink",
  },
} as const;

export function SidebarItem({ href, label, variant = "child" }: SidebarItemProps) {
  const pathname = usePathname();
  const closeMobileNav = useCloseMobileNav();
  const isActive = pathname === href;
  const classes = VARIANT_CLASSES[variant];

  return (
    <Link
      href={href}
      onClick={closeMobileNav}
      className={`${classes.base} ${isActive ? classes.active : classes.inactive}`}
    >
      {label}
    </Link>
  );
}
