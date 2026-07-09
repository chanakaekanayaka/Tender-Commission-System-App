"use client";

import { useRouter } from "next/navigation";
import { UserForm } from "@/components/features/users/UserForm";

/** Client wrapper so the create page itself can stay a Server Component — owns only the post-submit navigation. */
export function UserCreatePanel() {
  const router = useRouter();

  return <UserForm onSubmit={() => router.push("/admin/users")} onCancel={() => router.push("/admin/users")} />;
}
