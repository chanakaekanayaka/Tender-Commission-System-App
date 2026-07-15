"use client";

import { useRouter } from "next/navigation";
import { UserForm, type UserFormValues } from "@/components/features/users/UserForm";

/** Client wrapper so the create page itself can stay a Server Component — owns the register API call and post-submit navigation. */
export function UserCreatePanel() {
  const router = useRouter();

  async function handleCreate(values: UserFormValues) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      // Thrown here so UserForm's handleSubmit catches it and renders it inline instead of navigating away.
      throw new Error(result.message ?? "Failed to create user.");
    }

    router.push("/admin/users");
  }

  return <UserForm onSubmit={handleCreate} onCancel={() => router.push("/admin/users")} />;
}
