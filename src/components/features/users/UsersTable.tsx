"use client";

import { Lock, Unlock } from "lucide-react";
import { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { UserForm, type UserFormValues } from "@/components/features/users/UserForm";
import { useTranslation } from "@/context/LanguageContext";
import type { User } from "@/shared/types/user.types";

interface UsersTableProps {
  initialData: User[];
}

function restrictedCount(user: User) {
  return Object.values(user.permissions).filter((allowed) => !allowed).length;
}

/** Edit opens the shared UserForm in a Modal, Block/Unblock opens a confirm Modal — both PATCH /api/users/:id and update the row from the server's response on success. */
export function UsersTable({ initialData }: UsersTableProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState(initialData);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [row.firstName, row.lastName, row.email, row.role].join(" ").toLowerCase();
    return haystack.includes(q);
  });

  const editingUser = rows.find((row) => row.id === editingId) ?? null;
  const statusTargetUser = rows.find((row) => row.id === statusTargetId) ?? null;
  const nextStatus = statusTargetUser?.status === "Active" ? "Blocked" : "Active";

  const handleUpdate = async (values: UserFormValues) => {
    const res = await fetch(`/api/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      // Thrown so UserForm's handleSubmit catches it and renders it inline instead of closing the modal.
      throw new Error(result.message ?? "Failed to update user.");
    }

    setRows((prev) => prev.map((row) => (row.id === editingId ? result.data : row)));
    setEditingId(null);
  };

  const handleConfirmStatusChange = async () => {
    setToast(null);
    const res = await fetch(`/api/users/${statusTargetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      setToast({ message: result.message ?? "Failed to update status.", variant: "error" });
      return;
    }

    setRows((prev) => prev.map((row) => (row.id === statusTargetId ? result.data : row)));
    setStatusTargetId(null);
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
            id: "status",
            header: t("common.status"),
            cell: (row) => (
              <StatusBadge
                label={row.status === "Active" ? t("usersList.statusActive") : t("usersList.statusBlocked")}
                tone={row.status === "Active" ? "green" : "red"}
              />
            ),
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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(row.id)}
                  className="text-xs font-medium text-ink underline"
                >
                  {t("common.edit")}
                </button>
                {row.status === "Active" ? (
                  <button
                    type="button"
                    onClick={() => setStatusTargetId(row.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    {t("usersList.block")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatusTargetId(row.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <Unlock className="h-3.5 w-3.5" aria-hidden />
                    {t("usersList.unblock")}
                  </button>
                )}
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

      <Modal
        open={statusTargetUser !== null}
        onClose={() => {
          setStatusTargetId(null);
          setToast(null);
        }}
        title={nextStatus === "Blocked" ? t("usersList.blockConfirmTitle") : t("usersList.unblockConfirmTitle")}
      >
        {statusTargetUser && (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              {t(nextStatus === "Blocked" ? "usersList.blockConfirmBody" : "usersList.unblockConfirmBody", {
                name: `${statusTargetUser.firstName} ${statusTargetUser.lastName}`,
              })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatusTargetId(null);
                  setToast(null);
                }}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`inline-flex items-center gap-2 rounded-none px-4 py-2 text-sm font-medium text-white ${
                  nextStatus === "Blocked" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {nextStatus === "Blocked" ? (
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Unlock className="h-3.5 w-3.5" aria-hidden />
                )}
                {nextStatus === "Blocked" ? t("usersList.block") : t("usersList.unblock")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
