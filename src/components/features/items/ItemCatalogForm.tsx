"use client";

import { ImagePlus, Pencil, Trash2 } from "lucide-react";
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

const PAGE_SIZE = 10;

/** Client Component — Items are populated automatically from saved Price Schedules (see
 *  src/lib/db/items.ts), so this only lets an existing item's specs/image be edited, never
 *  created from scratch here. */
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

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">{t("items.existingItems")}</p>
          <SearchInput value={query} onChange={handleQueryChange} placeholder={t("items.searchPlaceholder")} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted uppercase">
                <th className="py-2 pr-3 font-semibold">{t("items.itemName")}</th>
                <th className="px-3 py-2 font-semibold">{t("items.itemCode")}</th>
                <th className="px-3 py-2 font-semibold">{t("items.specs")}</th>
                <th className="py-2 pl-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 font-medium text-ink">{item.name}</td>
                  <td className="px-3 py-2 text-muted">{item.code}</td>
                  <td className="px-3 py-2 text-muted">{item.specs.length}</td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEditor(item)}
                      className="text-muted hover:text-ink"
                      aria-label={t("items.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted">
                    {query ? t("items.noResults", { query }) : t("items.noItems")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

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
