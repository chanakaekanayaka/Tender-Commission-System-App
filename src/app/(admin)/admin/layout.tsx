import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LanguageProvider } from "@/context/LanguageContext";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardLayout sidebar={<AdminSidebar />}>{children}</DashboardLayout>
    </LanguageProvider>
  );
}
