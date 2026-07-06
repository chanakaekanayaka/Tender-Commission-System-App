import { SidebarGroup } from "@/components/layout/SidebarGroup";
import { SidebarItem } from "@/components/layout/SidebarItem";

interface SidebarLink {
  label: string;
  href: string;
}

interface SidebarGroupConfig {
  label: string;
  href?: string;
  children?: SidebarLink[];
}

const NAV_GROUPS: SidebarGroupConfig[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  {
    label: "Price Schedules",
    children: [
      { label: "Create", href: "/admin/tenders/create" },
      { label: "History", href: "/admin/tenders/history" },
    ],
  },
  {
    label: "Job Orders",
    children: [
      { label: "Create", href: "/admin/job-orders/create" },
      { label: "Active", href: "/admin/job-orders/active" },
      { label: "Pending", href: "/admin/job-orders/pending" },
      { label: "History", href: "/admin/job-orders/history" },
    ],
  },
  {
    label: "Commissions",
    children: [
      { label: "Pending", href: "/admin/commissions/pending" },
      { label: "History", href: "/admin/commissions/history" },
    ],
  },
  {
    label: "Other Expenses",
    children: [
      { label: "Create", href: "/admin/expenses/create" },
      { label: "History", href: "/admin/expenses/history" },
    ],
  },
  {
    label: "System Configs",
    children: [
      { label: "Users · Create", href: "/admin/users/create" },
      { label: "Users · List", href: "/admin/users" },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
}

/**
 * Server Component — no "use client" here. The only interactive pieces
 * (active-link highlighting, closing the mobile drawer on navigate) live in
 * SidebarItem, which is the sole Client Component in this tree.
 */
export function AdminSidebar({ className = "" }: AdminSidebarProps) {
  return (
    <div className={`flex h-full flex-col bg-sidebar text-sidebar-ink ${className}`}>
      <div className="p-4">
        <div className="rounded-none border border-white/10 py-2 text-center text-sm font-bold tracking-wide">
          TENDER-CMS
        </div>
      </div>

      <nav className="hide-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-4 text-sm">
        {NAV_GROUPS.map((group) =>
          group.children ? (
            <SidebarGroup key={group.label} label={group.label} items={group.children} />
          ) : (
            <SidebarItem key={group.label} href={group.href ?? "#"} label={group.label} variant="top" />
          ),
        )}
      </nav>
    </div>
  );
}
