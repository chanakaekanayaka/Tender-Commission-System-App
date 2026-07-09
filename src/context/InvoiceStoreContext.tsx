"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { seedInvoices } from "@/lib/mock/invoices.mock";
import type { InvoiceRequest } from "@/shared/types/invoice.types";

const STORAGE_KEY = "tcms-invoices";

interface InvoiceStoreValue {
  invoices: InvoiceRequest[];
  submitInvoice: (invoice: InvoiceRequest) => void;
  verifyInvoice: (id: string) => void;
  markPaid: (id: string, paymentBillFileName: string) => void;
}

const InvoiceStoreContext = createContext<InvoiceStoreValue | null>(null);

/**
 * The one piece of Invoices state that genuinely needs to outlive a single
 * page: Admin verifying/uploading a payment bill must show up on Staff's
 * History without a shared backend. Mounted once in the root layout (next to
 * ThemeProvider) so both the (admin) and (staff) route trees read the same
 * in-memory store; localStorage just survives a full page reload on top of
 * that.
 *
 * Unlike ThemeProvider's sidebarColor, `invoices` IS rendered directly into
 * JSX (DataTable rows on both portals) — so it must start from the SAME
 * value on the server render and the client's first (hydration) render, or
 * React throws a hydration mismatch the moment localStorage actually holds
 * something different from the static seed. That's why this store restores
 * from localStorage inside an effect (which only runs after hydration
 * completes) instead of a lazy useState initializer.
 */
export function InvoiceStoreProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<InvoiceRequest[]>(seedInvoices);

  // Runs once, after mount/hydration — never during SSR or the client's
  // first render, so it cannot cause a mismatch. This is the "sync from an
  // external system" case the set-state-in-effect lint rule itself carves
  // out; disabled deliberately rather than moved to a lazy initializer.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setInvoices(JSON.parse(stored) as InvoiceRequest[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices]);

  const submitInvoice = (invoice: InvoiceRequest) => setInvoices((prev) => [invoice, ...prev]);

  const verifyInvoice = (id: string) =>
    setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, verified: true } : invoice)));

  const markPaid = (id: string, paymentBillFileName: string) =>
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id ? { ...invoice, status: "Paid", paymentBillFileName } : invoice,
      ),
    );

  return (
    <InvoiceStoreContext.Provider value={{ invoices, submitInvoice, verifyInvoice, markPaid }}>
      {children}
    </InvoiceStoreContext.Provider>
  );
}

export function useInvoiceStore() {
  const ctx = useContext(InvoiceStoreContext);
  if (!ctx) throw new Error("useInvoiceStore must be used within an InvoiceStoreProvider");
  return ctx;
}
