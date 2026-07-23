import { LogoutButton } from "@/components/features/auth/LogoutButton";
import { SidebarGroup } from "@/components/layout/SidebarGroup";
import { SidebarItem } from "@/components/layout/SidebarItem";
import type { TranslationKey } from "@/lib/i18n/locales";

interface SidebarLink {
  labelKey: TranslationKey;
  href: string;
}

interface SidebarGroupConfig {
  labelKey: TranslationKey;
  href?: string;
  children?: SidebarLink[];
}

const NAV_GROUPS: SidebarGroupConfig[] = [
  { labelKey: "sidebar.dashboard", href: "/admin/dashboard" },
  {
    labelKey: "sidebar.priceSchedules",
    children: [
      { labelKey: "sidebar.create", href: "/admin/tenders/create" },
      { labelKey: "sidebar.history", href: "/admin/tenders/history" },
    ],
  },
  {
    labelKey: "sidebar.jobOrders",
    children: [
      { labelKey: "sidebar.create", href: "/admin/job-orders/create" },
      { labelKey: "sidebar.active", href: "/admin/job-orders/active" },
      { labelKey: "sidebar.pending", href: "/admin/job-orders/pending" },
      { labelKey: "sidebar.history", href: "/admin/job-orders/history" },
    ],
  },
  {
    labelKey: "sidebar.commissions",
    children: [
      { labelKey: "sidebar.pending", href: "/admin/commissions/pending" },
      { labelKey: "sidebar.history", href: "/admin/commissions/history" },
    ],
  },
  {
    labelKey: "sidebar.otherExpenses",
    children: [
      { labelKey: "sidebar.create", href: "/admin/expenses/create" },
      { labelKey: "sidebar.history", href: "/admin/expenses/history" },
    ],
  },
  {
    labelKey: "sidebar.invoices",
    children: [
      { labelKey: "sidebar.invoiceRequests", href: "/admin/invoices/requests" },
      { labelKey: "sidebar.history", href: "/admin/invoices/history" },
    ],
  },
  {
    labelKey: "sidebar.users",
    children: [
      { labelKey: "sidebar.create", href: "/admin/users/create" },
      { labelKey: "sidebar.list", href: "/admin/users" },
    ],
  },
  {
    labelKey: "sidebar.system",
    children: [{ labelKey: "sidebar.config", href: "/admin/system/config" }],
  },
  {
    labelKey: "sidebar.items",
    children: [
      { labelKey: "sidebar.catalog", href: "/admin/items/catalog" },
      { labelKey: "sidebar.createSpecsDoc", href: "/admin/items/create-specs-doc" },
    ],
  },
  {
    labelKey: "sidebar.analysis",
    children: [{ labelKey: "sidebar.marketAnalysis", href: "/admin/analysis/market-analysis" }],
  },
];

interface AdminSidebarProps {
  className?: string;
}

/**
 * Server Component — no "use client" here. The only interactive pieces
 * (active-link highlighting, closing the mobile drawer on navigate, and
 * translation lookup) live in SidebarItem/SidebarAccordion.
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
            <SidebarGroup key={group.labelKey} labelKey={group.labelKey} items={group.children} />
          ) : (
            <SidebarItem
              key={group.labelKey}
              href={group.href ?? "#"}
              labelKey={group.labelKey}
              variant="top"
            />
          ),
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <LogoutButton />
      </div>
    </div>
  );
}
