import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { StaffSidebar } from "@/components/layout/StaffSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  // proxy.ts already checks the JWT is valid, but it can't see a status change made
  // *after* the token was issued (e.g. an Admin blocking this account mid-session) —
  // that requires a DB read, which the layout does once per navigation instead.
  const user = await getCurrentUser();
  if (!user || user.status === "Blocked") {
    redirect("/login");
  }

  return (
    <LanguageProvider>
      <DashboardLayout sidebar={<StaffSidebar />}>{children}</DashboardLayout>
    </LanguageProvider>
  );
}
