"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/context/LanguageContext";
import { formatLKR } from "@/lib/utils/currency";
import type { VendorExcelUploadDetail } from "@/shared/types/vendorExcelUpload.types";

interface VendorExcelDetailModalProps {
  id: string;
  onClose: () => void;
}

/** Shows every vendor block exactly as extracted from the source Excel, all columns untouched —
 *  nothing summarized or dropped. The vendor-name search only filters which blocks are shown, not
 *  the underlying data, so a specific vendor (ours or a competitor) can be pulled out quickly. */
export function VendorExcelDetailModal({ id, onClose }: VendorExcelDetailModalProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<VendorExcelUploadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/vendor-excel-uploads/${id}`);
        const result = await res.json();
        if (res.ok && result.success) setDetail(result.data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const filteredBlocks = detail?.vendorBlocks.filter((block) =>
    block.vendorName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t("vendorExcelUploads.detailModalTitle", { fileName: detail?.fileName ?? "" })}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("vendorExcelUploads.uploading")}
        </div>
      ) : (
        <div className="space-y-6">
          <SearchInput value={query} onChange={setQuery} placeholder={t("vendorExcelUploads.vendorSearchPlaceholder")} />

          {filteredBlocks?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">{t("vendorExcelUploads.noVendorsFound", { query })}</p>
          )}

          {filteredBlocks?.map((block, i) => (
            <div key={`${block.vendorName}-${i}`} className="rounded-none border border-border">
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
                <p className="text-sm font-semibold text-ink">{block.vendorName}</p>
                {block.isOurVendor && <StatusBadge label={t("vendorExcelUploads.oursBadge")} tone="blue" />}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted uppercase">
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.itemNo")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.description")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.qty")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.unit")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.unitPriceExclVat")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.transport")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.subTotal")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.discount")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.priceWithoutVat")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.vatAmount")}</th>
                      <th className="px-3 py-2 font-semibold">{t("vendorExcelUploads.totalWithVat")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2 text-ink">{item.itemNo ?? "—"}</td>
                        <td className="px-3 py-2 text-ink">{item.description}</td>
                        <td className="px-3 py-2 text-ink">{item.qty}</td>
                        <td className="px-3 py-2 text-ink">{item.unit}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.unitPriceExclVat)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.transport)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.subTotal)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.discount)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.priceWithoutVat)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.vatAmount)}</td>
                        <td className="px-3 py-2 text-ink">{formatLKR(item.totalWithVat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
