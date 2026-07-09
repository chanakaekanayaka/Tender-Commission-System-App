import { T } from "@/components/features/i18n/T";
import { UserCreatePanel } from "@/components/features/users/UserCreatePanel";

export default function AdminUserCreatePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="userForm.createHeading" />
        </h1>
      </div>

      <UserCreatePanel />
    </div>
  );
}
