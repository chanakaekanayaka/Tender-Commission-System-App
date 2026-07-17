import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LanguageProvider } from "@/context/LanguageContext";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // proxy.ts already checks the JWT is valid, but it can't see a status change made
  // *after* the token was issued (e.g. another Admin blocking this account mid-session) —
  // that requires a DB read, which the layout does once per navigation instead.
  const user = await getCurrentUser();
  if (!user || user.status === "Blocked") {
    redirect("/login");
  }

  // Cross-portal guard: a Staff account hitting /admin/* gets bounced to their own dashboard
  // instead of a blank/forbidden page. (Moved here from proxy.ts — see proxy.ts for why.)
  if (user.role !== "Admin") {
    redirect("/staff/dashboard");
  }

  return (
    <LanguageProvider>
      <DashboardLayout sidebar={<AdminSidebar />}>{children}</DashboardLayout>
    </LanguageProvider>
  );
}
