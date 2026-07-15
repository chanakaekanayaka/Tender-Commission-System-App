import { T } from "@/components/features/i18n/T";
import { UsersTable } from "@/components/features/users/UsersTable";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import type { User } from "@/shared/types/user.types";

export default async function AdminUsersPage() {
  await connectDB();
  const users = await UserModel.find().sort({ createdAt: -1 });
  const initialData = users.map((user) => user.toJSON()) as unknown as User[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="usersList.heading" />
        </h1>
      </div>

      <UsersTable initialData={initialData} />
    </div>
  );
}
