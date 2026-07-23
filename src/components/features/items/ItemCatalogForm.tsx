"use client";

import { ImageOff, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { useTranslation } from "@/context/LanguageContext";
import type { CatalogItem, ItemSpec } from "@/shared/types/item.types";

interface ItemCatalogFormProps {
  initialItems: CatalogItem[];
}

const PAGE_SIZE = 12;

/** Client Component — Items are populated automatically from saved Price Schedules (see
 *  src/lib/db/items.ts). "Add New Item" lets a new one be created by hand too, but its code is
 *  always auto-assigned (see createItem() in src/lib/db/items.ts) — never user-editable. */
export function ItemCatalogForm({ initialItems }: ItemCatalogFormProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [specs, setSpecs] = useState<ItemSpec[]>([]);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!imagePreviewUrl) return;
    return () => URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(q));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const openEditor = (item: CatalogItem) => {
    setEditingItem(item);
    setSpecs(item.specs);
    setImageFile(null);
    setImagePreviewUrl(null);
    setNewSpecLabel("");
  };

  const closeEditor = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAddSpec = () => {
    const label = newSpecLabel.trim();
    if (!label) return;
    setSpecs((prev) => [...prev, { id: crypto.randomUUID(), label, value: "" }]);
    setNewSpecLabel("");
  };

  const handleSpecValueChange = (specId: string, value: string) => {
    setSpecs((prev) => prev.map((spec) => (spec.id === specId ? { ...spec, value } : spec)));
  };

  const handleRemoveSpec = (specId: string) => {
    setSpecs((prev) => prev.filter((spec) => spec.id !== specId));
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("specs", JSON.stringify(specs.map(({ label, value }) => ({ label, value }))));
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`/api/items/${editingItem.id}`, { method: "PATCH", body: formData });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to update item.");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, specs: result.data.specs, imageUrl: result.data.imageUrl ?? item.imageUrl }
            : item,
        ),
      );
      setToast({ message: t("items.updated"), variant: "success" });
      closeEditor();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to update item.", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewItemName("");
  };

  const handleCreateItem = async () => {
    const name = newItemName.trim();
    if (!name) return;
    setIsCreating(true);
    setToast(null);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to create item.");
      }

      setItems((prev) =>
        [...prev, { id: result.data.id, code: result.data.code, name: result.data.name, imageUrl: "", specs: [] }].sort(
          (a, b) => a.code.localeCompare(b.code),
        ),
      );
      setToast({ message: t("items.created"), variant: "success" });
      closeAddModal();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to create item.", variant: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("items.existingItems")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={query} onChange={handleQueryChange} placeholder={t("items.searchPlaceholder")} />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink whitespace-nowrap hover:bg-active/90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t("items.addNewItem")}
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            {query ? t("items.noResults", { query }) : t("items.noItems")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pageItems.map((item) => (
              <div key={item.id} className="group relative flex flex-col border border-border bg-card">
                <div className="relative aspect-square w-full border-b border-border bg-surface">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- runtime signed URL, not a static asset
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-6 w-6 text-muted" aria-hidden />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    aria-label={t("items.edit")}
                    className="absolute top-2 right-2 border border-border bg-card p-1.5 text-muted hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.code}</p>
                  <p className="text-xs text-muted">{t("items.specsCount", { count: item.specs.length })}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={isAddModalOpen} onClose={closeAddModal} title={t("items.addNewItem")}>
        <div className="space-y-4">
          <FormField
            label={t("items.itemName")}
            value={newItemName}
            onChange={setNewItemName}
            placeholder={t("items.itemNamePlaceholder")}
          />
          <p className="text-xs text-muted">{t("items.codeAutoAssigned")}</p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeAddModal}
              className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleCreateItem}
              disabled={!newItemName.trim() || isCreating}
              className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("items.save")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editingItem !== null} onClose={closeEditor} title={editingItem?.name ?? ""}>
        {editingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t("items.itemName")} value={editingItem.name} disabled />
              <FormField label={t("items.itemCode")} value={editingItem.code} disabled />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-none border border-dashed p-4 text-center ${
                isDragOver ? "border-active bg-active/5" : "border-border"
              }`}
            >
              {imagePreviewUrl ?? editingItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- runtime object/signed URL, not a static asset
                <img
                  src={imagePreviewUrl ?? editingItem.imageUrl}
                  alt={editingItem.name}
                  className="max-h-32 max-w-full object-contain"
                />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted" aria-hidden />
                  <p className="text-sm text-muted">{t("items.dragDropHint")}</p>
                </>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 text-xs font-medium text-active underline"
              >
                {t("items.uploadImages")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <FormField
                  label={t("items.addSpec")}
                  value={newSpecLabel}
                  onChange={setNewSpecLabel}
                  placeholder={t("items.specNamePlaceholder")}
                />
              </div>
              <button
                type="button"
                onClick={handleAddSpec}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("items.add")}
              </button>
            </div>

            {specs.length > 0 && (
              <div className="space-y-2">
                {specs.map((spec) => (
                  <div key={spec.id} className="flex items-center gap-3 border-b border-border pb-2 text-sm">
                    <span className="w-24 shrink-0 text-muted">{spec.label}</span>
                    <input
                      value={spec.value}
                      onChange={(e) => handleSpecValueChange(spec.id, e.target.value)}
                      className="flex-1 rounded-none border border-border bg-surface px-2 py-1 text-ink focus:border-active focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(spec.id)}
                      aria-label={t("common.delete")}
                      className="text-muted hover:text-ink"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-none border border-border bg-card px-4 py-2 text-sm font-medium text-ink hover:bg-active/5"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("items.save")}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  );
}
