import type { ReactNode } from "react";
import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LanguageProvider } from "@/context/LanguageContext";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DashboardLayout sidebar={<StaffSidebar />}>{children}</DashboardLayout>
    </LanguageProvider>
  );
}
