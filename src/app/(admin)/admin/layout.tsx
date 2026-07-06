import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout sidebar={<AdminSidebar />}>{children}</DashboardLayout>;
}
