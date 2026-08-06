import { redirect } from "next/navigation";
import { T } from "@/components/features/i18n/T";
import { Card } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/features/auth/ChangePasswordForm";
import { getCurrentUser } from "@/lib/auth/currentUser";

export default async function StaffProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="profile.heading" />
      </h1>

      <Card title={<T k="profile.accountDetailsHeading" />}>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">
              <T k="profile.name" />
            </dt>
            <dd className="text-ink">
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-muted">
              <T k="profile.email" />
            </dt>
            <dd className="text-ink">{user.email}</dd>
          </div>
        </dl>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
