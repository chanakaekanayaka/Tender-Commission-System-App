"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-2 rounded-none px-3 py-2 text-sm font-medium text-sidebar-ink/90 transition-colors hover:bg-white/5 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out…" : "Log Out"}
    </button>
  );
}
