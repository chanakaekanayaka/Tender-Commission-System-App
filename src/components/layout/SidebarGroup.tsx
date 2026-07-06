import { SidebarAccordion } from "@/components/layout/SidebarAccordion";
import { SidebarItem } from "@/components/layout/SidebarItem";

interface SidebarLink {
  label: string;
  href: string;
}

interface SidebarGroupProps {
  label: string;
  items: SidebarLink[];
}

/** Server Component — all accordion state lives in SidebarAccordion, the sole client boundary here. */
export function SidebarGroup({ label, items }: SidebarGroupProps) {
  return (
    <SidebarAccordion label={label} childHrefs={items.map((item) => item.href)}>
      {items.map((item) => (
        <SidebarItem key={item.href} href={item.href} label={item.label} variant="child" />
      ))}
    </SidebarAccordion>
  );
}
