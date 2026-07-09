import type { InvoiceRequest } from "@/shared/types/invoice.types";

// TODO: replace with a real fetch (GET /api/invoices) once that route exists.
// This is the seed for InvoiceStoreContext — after that, the store (backed by
// localStorage) is the source of truth so Staff submissions and Admin's
// Verify/Upload actions stay visible across both portals.
export const seedInvoices: InvoiceRequest[] = [
  {
    id: "inv1",
    invoiceNo: "INV-2026-0031",
    submittedBy: "Nadeesha Perera",
    submittedDate: "2026-07-02",
    items: [
      { id: "li1", type: "commission", label: "Commission — JO-2026-0142", amount: 18_500 },
      { id: "li2", type: "expense", label: "Site visit fuel & transport", amount: 4_500 },
    ],
    total: 23_000,
    status: "Pending Review",
    verified: false,
  },
  {
    id: "inv2",
    invoiceNo: "INV-2026-0027",
    submittedBy: "Kasun Fernando",
    submittedDate: "2026-06-15",
    items: [{ id: "li3", type: "commission", label: "Commission — JO-2026-0104", amount: 16_400 }],
    total: 16_400,
    status: "Paid",
    verified: true,
    paymentBillFileName: "invoice-INV-2026-0027-payment.pdf",
  },
];
