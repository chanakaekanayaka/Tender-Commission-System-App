import { SidebarAccordion } from "@/components/layout/SidebarAccordion";
import { SidebarItem } from "@/components/layout/SidebarItem";
import type { TranslationKey } from "@/lib/i18n/locales";

interface SidebarLink {
  labelKey: TranslationKey;
  href: string;
}

interface SidebarGroupProps {
  labelKey: TranslationKey;
  items: SidebarLink[];
}

/** Server Component — all accordion state (and translation lookup) lives in SidebarAccordion/SidebarItem, the only client boundaries here. */
export function SidebarGroup({ labelKey, items }: SidebarGroupProps) {
  return (
    <SidebarAccordion labelKey={labelKey} childHrefs={items.map((item) => item.href)}>
      {items.map((item) => (
        <SidebarItem key={item.href} href={item.href} labelKey={item.labelKey} variant="child" />
      ))}
    </SidebarAccordion>
  );
}
