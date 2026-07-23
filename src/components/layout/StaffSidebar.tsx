import { LogoutButton } from "@/components/features/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
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
  { labelKey: "sidebar.dashboard", href: "/staff/dashboard" },
  {
    labelKey: "sidebar.priceSchedules",
    children: [
      { labelKey: "sidebar.create", href: "/staff/tenders/create" },
      { labelKey: "sidebar.history", href: "/staff/tenders/history" },
    ],
  },
  {
    labelKey: "sidebar.jobOrders",
    children: [
      { labelKey: "sidebar.create", href: "/staff/job-orders/create" },
      { labelKey: "sidebar.active", href: "/staff/job-orders/active" },
      { labelKey: "sidebar.pending", href: "/staff/job-orders/pending" },
      { labelKey: "sidebar.history", href: "/staff/job-orders/history" },
    ],
  },
  {
    labelKey: "sidebar.payments",
    children: [
      { labelKey: "sidebar.pending", href: "/staff/commissions/pending" },
      { labelKey: "sidebar.history", href: "/staff/commissions/history" },
    ],
  },
  {
    labelKey: "sidebar.otherExpenses",
    children: [
      { labelKey: "sidebar.create", href: "/staff/expenses/create" },
      { labelKey: "sidebar.history", href: "/staff/expenses/history" },
    ],
  },
  {
    labelKey: "sidebar.invoices",
    children: [
      { labelKey: "sidebar.generateInvoice", href: "/staff/invoices/generate" },
      { labelKey: "sidebar.history", href: "/staff/invoices/history" },
    ],
  },
  {
    labelKey: "sidebar.items",
    children: [
      { labelKey: "sidebar.catalog", href: "/staff/items/catalog" },
      { labelKey: "sidebar.createSpecsDoc", href: "/staff/items/create-specs-doc" },
    ],
  },
  {
    labelKey: "sidebar.analysis",
    children: [{ labelKey: "sidebar.marketAnalysis", href: "/staff/analysis/market-analysis" }],
  },
];

interface StaffSidebarProps {
  className?: string;
}

/**
 * Server Component — no "use client" here. The only interactive pieces
 * (active-link highlighting, closing the mobile drawer on navigate, and
 * translation lookup) live in SidebarItem/SidebarAccordion/LanguageSwitcher.
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

      <div className="space-y-2 border-t border-white/10 p-3">
        <LanguageSwitcher />
        <LogoutButton />
      </div>
    </div>
  );
}
