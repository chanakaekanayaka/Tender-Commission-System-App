import type { ReactNode } from "react";
import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout sidebar={<StaffSidebar />}>{children}</DashboardLayout>;
}
