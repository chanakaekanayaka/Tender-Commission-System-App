"use client";

import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserForm, type UserFormValues } from "@/components/features/users/UserForm";
import { useTranslation } from "@/context/LanguageContext";
import type { User } from "@/shared/types/user.types";

interface UsersTableProps {
  initialData: User[];
}

function restrictedCount(user: User) {
  return Object.values(user.permissions).filter((allowed) => !allowed).length;
}

/** Mock-only list: Edit opens the shared UserForm in a Modal, Delete opens a confirm Modal. Row mutations only live for the component's lifetime — no backend wired up yet (AGENTS.md). */
export function UsersTable({ initialData }: UsersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [row.firstName, row.lastName, row.email, row.role].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  const editingUser = rows.find((row) => row.id === editingId) ?? null;
  const deletingUser = rows.find((row) => row.id === deletingId) ?? null;

  const handleUpdate = (values: UserFormValues) => {
    setRows((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...values } : row)));
    setEditingId(null);
  };

  const handleDelete = () => {
    setRows((prev) => prev.filter((row) => row.id !== deletingId));
    setDeletingId(null);
  };

  return (
    <div className="rounded-none border border-border bg-card p-4">
      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder={t("usersList.searchPlaceholder")} />
      </div>

      <DataTable
        columns={[
          { id: "name", header: t("common.name"), cell: (row) => `${row.firstName} ${row.lastName}` },
          { id: "email", header: t("userForm.email"), cell: (row) => row.email },
          {
            id: "role",
            header: t("common.role"),
            cell: (row) => <StatusBadge label={row.role} tone={row.role === "Admin" ? "blue" : "neutral"} />,
          },
          {
            id: "access",
            header: t("usersList.access"),
            cell: (row) =>
              row.role === "Admin" || restrictedCount(row) === 0 ? (
                <span className="text-xs text-muted">{t("usersList.fullAccess")}</span>
              ) : (
                <StatusBadge label={t("usersList.restricted", { count: restrictedCount(row) })} tone="amber" />
              ),
          },
          {
            id: "actions",
            header: t("common.actions"),
            cell: (row) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(row.id)}
                  className="text-xs font-medium text-ink underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingId(row.id)}
                  className="text-xs font-medium text-ink underline"
                >
                  {t("common.delete")}
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
        rowKey={(row) => row.id}
        emptyMessage={t("usersList.noResults", { query })}
      />

      <Modal open={editingUser !== null} onClose={() => setEditingId(null)} title={t("userForm.editHeading")}>
        {editingUser && (
          <UserForm initialUser={editingUser} onSubmit={handleUpdate} onCancel={() => setEditingId(null)} />
        )}
      </Modal>

      <Modal open={deletingUser !== null} onClose={() => setDeletingId(null)} title={t("usersList.deleteConfirmTitle")}>
        {deletingUser && (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              {t("usersList.deleteConfirmBody", { name: `${deletingUser.firstName} ${deletingUser.lastName}` })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
