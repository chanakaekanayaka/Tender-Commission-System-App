import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";

/** `/` has no UI of its own — it only decides where to send the visitor next. */
export default async function Home() {
  const user = await getCurrentUser();

  if (user && user.status === "Active") {
    redirect(user.role === "Admin" ? "/admin/dashboard" : "/staff/dashboard");
  }

  redirect("/login");
}