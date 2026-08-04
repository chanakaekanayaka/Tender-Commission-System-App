import { T } from "@/components/features/i18n/T";
import { UsersTable } from "@/components/features/users/UsersTable";
import connectDB from "@/lib/db/connectDB";
import { UserModel } from "@/lib/db/models/User.model";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { User } from "@/shared/types/user.types";

interface AdminUsersPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  const { rows: users, total, totalPages, page: currentPage } = await paginateFind(
    UserModel,
    {},
    ["firstName", "lastName", "email"],
    { search, page, limit: DEFAULT_PAGE_SIZE },
    { createdAt: -1 },
  );
  const data = users.map((user) => user.toJSON()) as unknown as User[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="usersList.heading" />
        </h1>
      </div>

      <UsersTable data={data} search={search} page={currentPage} totalPages={totalPages} total={total} />
    </div>
  );
}
