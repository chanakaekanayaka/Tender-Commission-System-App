"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const MOCK_ROUTES: Record<string, string> = {
  "admin@test.com": "/admin/dashboard",
  "staff@test.com": "/staff/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const destination = MOCK_ROUTES[email.trim().toLowerCase()];
    if (!destination) {
      setError("Unrecognized email. Try admin@test.com or staff@test.com.");
      return;
    }

    setError(null);
    router.push(destination);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <label className="block text-sm">
        <span className="text-muted">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@test.com"
          required
          className="mt-1 w-full rounded-none border border-border bg-surface px-3 py-2 text-ink"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="mt-1 w-full rounded-none border border-border bg-surface px-3 py-2 text-ink"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink"
      >
        Log In
      </button>
    </form>
  );
}
