import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-none border border-border bg-card p-6">
        <h1 className="mb-6 text-center text-lg font-bold tracking-wide text-ink">TENDER-CMS</h1>
        <LoginForm />
      </div>
    </div>
  );
}
