"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Toast, type ToastState } from "@/components/ui/Toast";

const ROLE_HOME: Record<string, string> = {
  Admin: "/admin/dashboard",
  Staff: "/staff/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setToast({ message: result.message ?? "Login failed. Please try again.", variant: "error" });
        return;
      }

      router.push(ROLE_HOME[result.data.role] ?? "/login");
    } catch {
      setToast({ message: "Could not reach the server. Please try again.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <label className="block text-sm">
        <span className="text-muted">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="mt-1 w-full rounded-none border border-border bg-surface px-3 py-2 text-ink"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Password</span>
        <div className="relative mt-1">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-none border border-border bg-surface px-3 py-2 pr-10 text-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Logging in…" : "Log In"}
      </button>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </form>
  );
}
