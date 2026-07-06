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
  { label: "Dashboard", href: "/staff/dashboard" },
  {
    label: "Price Schedules",
    children: [
      { label: "Create", href: "/staff/tenders/create" },
      { label: "History", href: "/staff/tenders/history" },
    ],
  },
  {
    label: "Job Orders",
    children: [
      { label: "Create", href: "/staff/job-orders/create" },
      { label: "Active", href: "/staff/job-orders/active" },
      { label: "Pending", href: "/staff/job-orders/pending" },
      { label: "History", href: "/staff/job-orders/history" },
    ],
  },
  {
    label: "Commissions",
    children: [
      { label: "Pending", href: "/staff/commissions/pending" },
      { label: "History", href: "/staff/commissions/history" },
    ],
  },
  {
    label: "Other Expenses",
    children: [
      { label: "Create", href: "/staff/expenses/create" },
      { label: "History", href: "/staff/expenses/history" },
    ],
  },
];

interface StaffSidebarProps {
  className?: string;
}

/**
 * Server Component — no "use client" here. The only interactive pieces
 * (active-link highlighting, closing the mobile drawer on navigate) live in
 * SidebarItem, which is the sole Client Component in this tree.
 */
export function StaffSidebar({ className = "" }: StaffSidebarProps) {
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
