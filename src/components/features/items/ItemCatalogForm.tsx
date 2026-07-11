"use client";

import { ImagePlus, Pencil } from "lucide-react";
import { useState, type DragEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { useTranslation } from "@/context/LanguageContext";
import type { CatalogItem, ItemSpec } from "@/shared/types/item.types";

interface ItemCatalogFormProps {
  initialItems: CatalogItem[];
}

const EMPTY_FORM = { id: null as string | null, code: "", name: "", imageUrl: "", specs: [] as ItemSpec[] };

function readImageAsDataUrl(file: File, onLoad: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}

/** Client Component — holds the add/edit form state, drag-and-drop image preview, and the in-session items list; the sole client boundary in "Catalog". */
export function ItemCatalogForm({ initialItems }: ItemCatalogFormProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    readImageAsDataUrl(file, (dataUrl) => setForm((f) => ({ ...f, imageUrl: dataUrl })));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAddSpec = () => {
    const label = newSpecLabel.trim();
    if (!label) return;
    const spec: ItemSpec = { id: crypto.randomUUID(), label, value: "" };
    setForm((f) => ({ ...f, specs: [...f.specs, spec] }));
    setEditingSpecId(spec.id);
    setNewSpecLabel("");
  };

  const handleSpecValueChange = (specId: string, value: string) => {
    setForm((f) => ({
      ...f,
      specs: f.specs.map((spec) => (spec.id === specId ? { ...spec, value } : spec)),
    }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) return;

    if (form.id) {
      setItems((prev) =>
        prev.map((item) => (item.id === form.id ? { ...item, ...form, id: form.id! } : item)),
      );
    } else {
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), code: form.code, name: form.name, imageUrl: form.imageUrl, specs: form.specs },
      ]);
    }
    setForm(EMPTY_FORM);
    setEditingSpecId(null);
  };

  const handleEdit = (item: CatalogItem) => {
    setForm({ id: item.id, code: item.code, name: item.name, imageUrl: item.imageUrl, specs: item.specs });
    setEditingSpecId(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-none border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("items.itemName")} value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
          <FormField label={t("items.itemCode")} value={form.code} onChange={(code) => setForm((f) => ({ ...f, code }))} />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`mt-4 flex min-h-40 flex-col items-center justify-center gap-2 rounded-none border border-dashed p-4 text-center ${
            isDragOver ? "border-active bg-active/5" : "border-border"
          }`}
        >
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imageUrl} alt={form.name} className="max-h-32 max-w-full object-contain" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-muted" aria-hidden />
              <p className="text-sm text-muted">{t("items.dragDropHint")}</p>
            </>
          )}
          <label className="mt-1 cursor-pointer text-xs font-medium text-active underline">
            {t("items.uploadImages")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
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

        {form.specs.length > 0 && (
          <div className="mt-4 space-y-2">
            {form.specs.map((spec) => (
              <div key={spec.id} className="flex items-center gap-3 border-b border-border pb-2 text-sm">
                <span className="w-24 shrink-0 text-muted">{spec.label}</span>
                {editingSpecId === spec.id ? (
                  <input
                    autoFocus
                    value={spec.value}
                    onChange={(e) => handleSpecValueChange(spec.id, e.target.value)}
                    onBlur={() => setEditingSpecId(null)}
                    className="flex-1 rounded-none border border-border bg-surface px-2 py-1 text-ink focus:border-active focus:outline-none"
                  />
                ) : (
                  <span className="flex-1 text-ink">{spec.value}</span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingSpecId(spec.id)}
                  aria-label={t("items.edit")}
                  className="text-muted hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-none bg-active px-4 py-2 text-sm font-medium text-active-ink"
          >
            {t("items.save")}
          </button>
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{t("items.existingItems")}</p>
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
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 font-medium text-ink">{item.name}</td>
                  <td className="px-3 py-2 text-muted">{item.code}</td>
                  <td className="px-3 py-2 text-muted">{item.specs.length}</td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-muted hover:text-ink"
                      aria-label={t("items.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
