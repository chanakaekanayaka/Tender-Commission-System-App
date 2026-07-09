import { T } from "@/components/features/i18n/T";
import { UsersTable } from "@/components/features/users/UsersTable";
import { users } from "@/lib/mock/users.mock";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="usersList.heading" />
        </h1>
      </div>

      <UsersTable initialData={users} />
    </div>
  );
}
