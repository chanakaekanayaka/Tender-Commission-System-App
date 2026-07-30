"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { jobOrderMetadataByProcurement } from "@/lib/mock/jobOrders.mock";
import { calculateLineItemTotals, percentFromValue, valueFromPercent } from "@/lib/utils/pricing";
import type {
  AmountInputMode,
  JobOrderCompletionStep,
  JobOrderLineItem,
  JobOrderMetadata,
  OtherExpenseItem,
  ProcurementOption,
  ReceiptItem,
  SourceDocumentState,
  StaffOption,
} from "@/shared/types/job-order.types";

const EMPTY_METADATA: JobOrderMetadata = { address: "", telephone: "", email: "", note: "" };

const sumSubTotals = (items: JobOrderLineItem[], vatRate: number) =>
  items.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal, 0);

let idSeq = 0;
const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

interface JobOrderWizardValue {
  role: "admin" | "staff";
  step: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;

  procurementNo: string;
  procuringEntity: string;
  procurementOptionsList: ProcurementOption[];
  isLoadingProcurementOptions: boolean;
  handleSelectProcurement: (procurementNo: string) => void;

  /** Real, from System Config — 0 unless Admin has VAT registration enabled (never the old
   *  hardcoded 15% default). Drives every line-item VAT/subtotal shown or saved in this wizard. */
  vatRate: number;

  sourceDocument: SourceDocumentState | null;
  uploadSourceDocument: (file: File) => void;
  removeSourceDocument: () => void;

  metadata: JobOrderMetadata;
  isParsing: boolean;
  handleParse: () => void;
  updateMetadataField: (field: keyof JobOrderMetadata, value: string) => void;

  originalItems: JobOrderLineItem[];
  items: JobOrderLineItem[];
  isLoadingItems: boolean;
  handleRemoveItem: (id: string) => void;

  assignedStaffId: string;
  setAssignedStaffId: (id: string) => void;
  staffOptionsList: StaffOption[];
  isLoadingStaffOptions: boolean;

  receipts: ReceiptItem[];
  addReceipts: (files: File[]) => void;
  removeReceipt: (id: string) => void;
  updateReceiptAmount: (id: string, amount: number) => void;

  otherExpenses: OtherExpenseItem[];
  handleAddExpense: () => void;
  handleRemoveExpense: (id: string) => void;
  handleExpenseChange: (id: string, field: "label" | "amount", value: string) => void;
  expensesZeroed: boolean;
  setExpensesZeroed: (zeroed: boolean) => void;

  markupValue: number;
  markupPercent: number;
  setMarkupValue: (value: number) => void;
  setMarkupPercent: (percent: number) => void;

  commissionValue: number;
  commissionPercent: number;
  setCommissionValue: (value: number) => void;
  setCommissionPercent: (percent: number) => void;
  commissionZeroed: boolean;
  setCommissionZeroed: (zeroed: boolean) => void;

  originalTotal: number;
  newTotal: number;
  receiptsTotal: number;
  manualExpensesTotal: number;
  otherExpensesTotal: number;
  /** New Total minus Other Expenses — "Overall Profit". The base Company Profit/Sales Commission
   *  are entered as a value or percentage of; negative means the job order is at a loss, shown
   *  directly (colored red/green) as the Financial Summary's bottom-line figure. */
  profitBase: number;

  canProceedFromStep1: boolean;

  jobOrderId: string | null;
  isLoadingJobOrder: boolean;
  isSavingDraft: boolean;
  saveDraft: () => Promise<{ success: boolean; message: string }>;
  isCompleting: boolean;
  completeJobOrder: () => Promise<{ success: boolean; message: string }>;
}

const JobOrderWizardContext = createContext<JobOrderWizardValue | null>(null);

export function JobOrderWizardProvider({
  role,
  initialStep,
  jobOrderId: initialJobOrderId,
  children,
}: {
  role: "admin" | "staff";
  /** Lets a caller deep-link straight into a step (e.g. "Receipt Upload" → Step 2) instead of always starting fresh at Step 1. Clamped to 1-3. */
  initialStep?: number;
  /** Resumes an already-created Job Order instead of starting a blank wizard — set when a caller
   *  links in from the Active table (row's Job Order No, or its Receipt Upload action). */
  jobOrderId?: string;
  children: ReactNode;
}) {
  const [step, setStep] = useState(() => Math.min(3, Math.max(1, initialStep ?? 1)));

  const [procurementNo, setProcurementNo] = useState("");
  const [procurementTitle, setProcurementTitle] = useState("");
  const [procuringEntity, setProcuringEntity] = useState("");
  const [procurementOptionsList, setProcurementOptionsList] = useState<ProcurementOption[]>([]);
  const [isLoadingProcurementOptions, setIsLoadingProcurementOptions] = useState(true);
  const [sourceDocument, setSourceDocument] = useState<SourceDocumentState | null>(null);
  const [metadata, setMetadata] = useState<JobOrderMetadata>(EMPTY_METADATA);
  const [isParsing, setIsParsing] = useState(false);
  const [originalItems, setOriginalItems] = useState<JobOrderLineItem[]>([]);
  const [items, setItems] = useState<JobOrderLineItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [staffOptionsList, setStaffOptionsList] = useState<StaffOption[]>([]);
  const [isLoadingStaffOptions, setIsLoadingStaffOptions] = useState(true);
  // 0 (no VAT) until System Config says otherwise — never the old hardcoded 15% default.
  const [vatRate, setVatRate] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/system-config");
      const result = await res.json();
      if (res.ok && result.success) {
        setVatRate(result.data.isVatRegistered ? result.data.vatPercentage / 100 : 0);
      }
    })();
  }, []);

  // Admin picks from every active Staff account to assign the job order to; Staff can't reassign
  // at all (AssignStaffSelect renders their name read-only), so they only ever need themselves —
  // which also fills in the id a resumed Staff session's own assignedStaffId should already match.
  useEffect(() => {
    (async () => {
      try {
        if (role === "admin") {
          const res = await fetch("/api/users?role=Staff&status=Active");
          const result = await res.json();
          if (res.ok && result.success) {
            setStaffOptionsList(
              result.data.map((user: { id: string; firstName: string; lastName: string }) => ({
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
              })),
            );
          }
        } else {
          const res = await fetch("/api/auth/me");
          const result = await res.json();
          if (res.ok && result.success) {
            const me = { id: result.data.id, name: `${result.data.firstName} ${result.data.lastName}` };
            setStaffOptionsList([me]);
            setAssignedStaffId(me.id);
          }
        }
      } finally {
        setIsLoadingStaffOptions(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- role is fixed for the wizard's lifetime
  }, []);

  // Real, completed Price Schedules eligible to become a Job Order — a company-wide list, not
  // scoped to who's logged in (see the GET /api/price-schedules?status= handling).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/price-schedules?status=Completed");
        const result = await res.json();
        if (res.ok && result.success) {
          setProcurementOptionsList(
            result.data.map((row: { id: string; procurementNo: string; procurementTitle: string; entity: string }) => ({
              id: row.id,
              procurementNo: row.procurementNo,
              procurementTitle: row.procurementTitle,
              procuringEntity: row.entity,
            })),
          );
        }
      } finally {
        setIsLoadingProcurementOptions(false);
      }
    })();
  }, []);

  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>([]);
  const [expensesZeroed, setExpensesZeroed] = useState(false);

  const [jobOrderId, setJobOrderId] = useState<string | null>(initialJobOrderId ?? null);
  const [isLoadingJobOrder, setIsLoadingJobOrder] = useState(Boolean(initialJobOrderId));
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [markupMode, setMarkupMode] = useState<AmountInputMode>("percentage");
  const [markupPercentInput, setMarkupPercentInput] = useState(0);
  const [markupValueInput, setMarkupValueInput] = useState(0);

  const [commissionMode, setCommissionMode] = useState<AmountInputMode>("percentage");
  const [commissionPercentInput, setCommissionPercentInput] = useState(0);
  const [commissionValueInput, setCommissionValueInput] = useState(0);
  const [commissionZeroed, setCommissionZeroed] = useState(false);

  // Markup and Sales Commission split 100% of the profit base between the company and the sales
  // agent — only one side is ever independently typed at a time, the other is always its
  // complement. Admin can drive the split from either side; Staff can only ever drive it from
  // Commission (Markup is locked read-only for them — see JobOrderStepMarkup), so their split
  // basis starts there and never has a reason to change.
  const [profitSplitBasis, setProfitSplitBasis] = useState<"markup" | "commission">(
    role === "staff" ? "commission" : "markup",
  );

  // Resumes an already-created Job Order (linked in from the Active table) instead of starting a
  // blank wizard — loads every field the record actually has, including a fresh signed preview URL
  // per already-uploaded receipt (its original blob URL only ever existed in the browser that
  // uploaded it). Runs once, since `initialJobOrderId` is set by the caller at mount and never changes.
  useEffect(() => {
    if (!initialJobOrderId) return;

    (async () => {
      try {
        const res = await fetch(`/api/job-orders/${initialJobOrderId}`);
        const result = await res.json();
        if (!res.ok || !result.success) return;
        const data = result.data;

        setProcurementNo(data.procurementNo);
        setProcurementTitle(data.procurementTitle);
        setProcuringEntity(data.procuringEntity);
        setAssignedStaffId(data.assignedStaffId);
        setMetadata(data.metadata);
        if (data.sourceDocument) {
          setSourceDocument({
            fileName: data.sourceDocument.fileName,
            fileType: data.sourceDocument.fileType,
            s3Key: data.sourceDocument.s3Key,
            uploadedAt: data.sourceDocument.uploadedAt,
            isUploading: false,
          });
        }

        const toLineItems = (rows: { item: string; qty: number; unitPrice: number }[]): JobOrderLineItem[] =>
          rows.map((row, index) => ({ id: `line-${index}`, item: row.item, qty: row.qty, unitPrice: row.unitPrice }));
        setOriginalItems(toLineItems(data.originalLineItems));
        setItems(toLineItems(data.lineItems));

        setReceipts(
          data.receipts.map(
            (receipt: { fileName: string; amount: number; fileType: string; s3Key: string; previewUrl: string }) => ({
              id: nextId("receipt"),
              fileName: receipt.fileName,
              amount: receipt.amount,
              fileType: receipt.fileType,
              previewUrl: receipt.previewUrl,
              s3Key: receipt.s3Key,
              isUploading: false,
            }),
          ),
        );
        setOtherExpenses(
          data.otherExpenses.map((expense: { label: string; amount: number }) => ({
            id: nextId("expense"),
            label: expense.label,
            amount: expense.amount,
          })),
        );
        setExpensesZeroed(data.expensesZeroed);

        setMarkupMode("value");
        setMarkupValueInput(data.markupValue);
        setCommissionMode("value");
        setCommissionValueInput(data.commissionZeroed ? 0 : data.commissionValue);
        setCommissionZeroed(data.commissionZeroed);
      } finally {
        setIsLoadingJobOrder(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only, see comment above
  }, []);

  // Revoke any remaining receipt object URLs when the wizard unmounts (e.g. the
  // user navigates away mid-flow) — a ref keeps this reading the latest list
  // without re-registering the cleanup effect on every receipts change.
  const receiptsRef = useRef(receipts);
  useEffect(() => {
    receiptsRef.current = receipts;
  }, [receipts]);
  useEffect(() => {
    return () => {
      receiptsRef.current.forEach((receipt) => URL.revokeObjectURL(receipt.previewUrl));
    };
  }, []);

  // Only lets the Stepper jump backward to an already-visited step — forward
  // progress is always gated behind the Next button's own validation.
  const goToStep = (target: number) => setStep((current) => (target < current ? target : current));
  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSelectProcurement = (nextProcurementNo: string) => {
    setProcurementNo(nextProcurementNo);
    setJobOrderId(null);
    setSourceDocument(null);
    setMetadata(EMPTY_METADATA);
    setOriginalItems([]);
    setItems([]);

    // Fresh procurement = fresh job order — don't carry over calc state from
    // whatever was previously selected. Revoke the outgoing receipts' object
    // URLs first so their blob data doesn't leak for the rest of the session.
    receipts.forEach((receipt) => URL.revokeObjectURL(receipt.previewUrl));
    setReceipts([]);
    setOtherExpenses([]);
    setExpensesZeroed(false);
    setMarkupMode("percentage");
    setMarkupPercentInput(0);
    setMarkupValueInput(0);
    setCommissionMode("percentage");
    setCommissionPercentInput(0);
    setCommissionValueInput(0);
    setCommissionZeroed(false);
    setProfitSplitBasis(role === "staff" ? "commission" : "markup");

    // Line items come straight from the linked Price Schedule the moment it's selected — no
    // separate "parse" step needed for these, unlike the Source Document metadata below.
    const option = procurementOptionsList.find((opt) => opt.procurementNo === nextProcurementNo);
    if (!option) return;

    setProcurementTitle(option.procurementTitle);
    setProcuringEntity(option.procuringEntity);

    setIsLoadingItems(true);
    (async () => {
      try {
        const res = await fetch(`/api/price-schedules/${option.id}`);
        const result = await res.json();
        if (res.ok && result.success) {
          const lineItems: JobOrderLineItem[] = result.data.lineItems.map(
            (row: { item: string; qty: number; unitPrice: number }, index: number) => ({
              id: `line-${index}`,
              item: row.item,
              qty: row.qty,
              unitPrice: row.unitPrice,
            }),
          );
          setOriginalItems(lineItems);
          setItems(lineItems);
        }
      } finally {
        setIsLoadingItems(false);
      }
    })();
  };

  // Uploads to S3 as soon as a file is dropped — real upload only for now, no OCR/parsing wired up
  // yet, so Metadata below stays manually typed regardless of what's in this file.
  const uploadSourceDocument = (file: File) => {
    setSourceDocument({ fileName: file.name, fileType: file.type, s3Key: null, isUploading: true });

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/job-orders/source-document", { method: "POST", body: formData })
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message ?? "Failed to upload source document.");
        }
        setSourceDocument({
          fileName: file.name,
          fileType: file.type,
          s3Key: result.data.s3Key,
          uploadedAt: new Date().toISOString(),
          isUploading: false,
        });
      })
      .catch((err) => {
        setSourceDocument({
          fileName: file.name,
          fileType: file.type,
          s3Key: null,
          isUploading: false,
          uploadError: err instanceof Error ? err.message : "Failed to upload source document.",
        });
      });
  };
  const removeSourceDocument = () => setSourceDocument(null);

  // Placeholder for the real document-scan extraction of the Job Order's own Source Document
  // (still mock for now, per the user's request — that part comes once the real documents are
  // ready) — Address/Telephone/Email/Note only, not line items, which the Price Schedule above
  // already provides.
  const handleParse = () => {
    if (!procurementNo) return;
    setIsParsing(true);
    setTimeout(() => {
      setMetadata(jobOrderMetadataByProcurement[procurementNo] ?? EMPTY_METADATA);
      setIsParsing(false);
    }, 1200);
  };

  const updateMetadataField = (field: keyof JobOrderMetadata, value: string) =>
    setMetadata((prev) => ({ ...prev, [field]: value }));

  const handleRemoveItem = (id: string) => setItems((prev) => prev.filter((row) => row.id !== id));

  // Uploads to S3 as soon as a file is dropped — s3Key (not previewUrl) is what actually
  // persists once the Job Order itself is saved. previewUrl stays for the instant in-browser
  // preview so the user isn't stuck waiting on the network round-trip just to see what they picked.
  const addReceipts = (files: File[]) => {
    const newReceipts: ReceiptItem[] = files.map((file) => ({
      id: nextId("receipt"),
      fileName: file.name,
      amount: 0,
      fileType: file.type,
      previewUrl: URL.createObjectURL(file),
      s3Key: null,
      isUploading: true,
    }));

    setReceipts((prev) => [...prev, ...newReceipts]);

    newReceipts.forEach((receipt, index) => {
      const file = files[index];
      const formData = new FormData();
      formData.append("file", file);

      fetch("/api/job-orders/receipts", { method: "POST", body: formData })
        .then(async (res) => {
          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.message ?? "Failed to upload receipt.");
          }
          setReceipts((prev) =>
            prev.map((r) => (r.id === receipt.id ? { ...r, s3Key: result.data.s3Key, isUploading: false } : r)),
          );
        })
        .catch((err) => {
          setReceipts((prev) =>
            prev.map((r) =>
              r.id === receipt.id
                ? {
                    ...r,
                    isUploading: false,
                    uploadError: err instanceof Error ? err.message : "Failed to upload receipt.",
                  }
                : r,
            ),
          );
        });
    });
  };
  const removeReceipt = (id: string) =>
    setReceipts((prev) => {
      const target = prev.find((receipt) => receipt.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((receipt) => receipt.id !== id);
    });
  const updateReceiptAmount = (id: string, amount: number) =>
    setReceipts((prev) =>
      prev.map((receipt) => (receipt.id === id ? { ...receipt, amount: Math.max(0, amount) } : receipt)),
    );

  const handleAddExpense = () =>
    setOtherExpenses((prev) => [...prev, { id: nextId("expense"), label: "", amount: 0 }]);
  const handleRemoveExpense = (id: string) =>
    setOtherExpenses((prev) => prev.filter((expense) => expense.id !== id));
  const handleExpenseChange = (id: string, field: "label" | "amount", value: string) =>
    setOtherExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id
          ? { ...expense, [field]: field === "amount" ? Math.max(0, Number(value) || 0) : value }
          : expense,
      ),
    );

  const originalTotal = sumSubTotals(originalItems, vatRate);
  const newTotal = sumSubTotals(items, vatRate);

  const receiptsTotal = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const manualExpensesTotal = expensesZeroed
    ? 0
    : otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const otherExpensesTotal = receiptsTotal + manualExpensesTotal;

  // Overall Profit — what New Total actually leaves once Step 2's receipts/expenses are paid for.
  // Company Profit and Sales Commission are both entered as a value or a percentage of this, and
  // it can go negative (a loss): the job order cost more in expenses than the current line items
  // are worth. Financial Summary shows this figure directly, colored red/green by its sign.
  const profitBase = newTotal - otherExpensesTotal;

  // Each side's own value ⇄ percentage pair, resolved independently of the other — only one of
  // these two ever actually feeds into the split below (whichever `profitSplitBasis` says is
  // being driven right now); the other is recomputed from it as the complement.
  const markupOwnValue =
    markupMode === "percentage" ? valueFromPercent(profitBase, markupPercentInput) : markupValueInput;
  const markupOwnPercent =
    markupMode === "percentage" ? markupPercentInput : percentFromValue(profitBase, markupValueInput);
  const commissionOwnValue =
    commissionMode === "percentage" ? valueFromPercent(profitBase, commissionPercentInput) : commissionValueInput;
  const commissionOwnPercent =
    commissionMode === "percentage" ? commissionPercentInput : percentFromValue(profitBase, commissionValueInput);

  // Company Profit (the company's share) and Sales Commission (the sales agent's share) split
  // Overall Profit — Admin can drive the split from either side; Staff can only ever drive it from
  // Commission (Company Profit is locked read-only for them, and disabled outright once Overall
  // Profit is negative — there's no commission to pay out of a loss). commissionZeroed is a full
  // override: no agent this time, so Company Profit is whatever was typed on its own, independent
  // of any split. Deliberately not clamped to 0 — a loss has to stay visible as a negative number,
  // not silently disappear.
  let markupValue: number;
  let markupPercent: number;
  let commissionValue: number;
  let commissionPercent: number;
  if (commissionZeroed) {
    commissionValue = 0;
    commissionPercent = 0;
    markupValue = markupOwnValue;
    markupPercent = markupOwnPercent;
  } else if (profitBase < 0) {
    // A loss — no commission to pay out, so it all falls to Company Profit (i.e. the whole loss).
    commissionValue = 0;
    commissionPercent = 0;
    markupValue = profitBase;
    markupPercent = percentFromValue(profitBase, markupValue);
  } else if (profitSplitBasis === "commission") {
    commissionValue = commissionOwnValue;
    commissionPercent = commissionOwnPercent;
    markupValue = profitBase - commissionValue;
    markupPercent = percentFromValue(profitBase, markupValue);
  } else {
    markupValue = markupOwnValue;
    markupPercent = markupOwnPercent;
    commissionValue = profitBase - markupValue;
    commissionPercent = percentFromValue(profitBase, commissionValue);
  }

  const buildJobOrderPayload = (status: "Draft" | "Completed", completedStep: JobOrderCompletionStep) => ({
      procurementNo,
      procurementTitle,
      procuringEntity,
      assignedStaffId,
      sourceDocument:
        sourceDocument?.s3Key && sourceDocument.uploadedAt
          ? {
              fileName: sourceDocument.fileName,
              fileType: sourceDocument.fileType,
              s3Key: sourceDocument.s3Key,
              uploadedAt: sourceDocument.uploadedAt,
            }
          : null,
      metadata,
      originalLineItems: originalItems.map(({ item, qty, unitPrice }) => ({ item, qty, unitPrice })),
      lineItems: items.map(({ item, qty, unitPrice }) => ({ item, qty, unitPrice })),
      receipts: receipts
        .filter((receipt): receipt is ReceiptItem & { s3Key: string } => Boolean(receipt.s3Key))
        .map((receipt) => ({
          fileName: receipt.fileName,
          amount: receipt.amount,
          fileType: receipt.fileType,
          s3Key: receipt.s3Key,
        })),
      otherExpenses: otherExpenses.map(({ label, amount }) => ({ label, amount })),
      expensesZeroed,
      markupValue,
      commissionValue,
      commissionZeroed,
      completedStep,
      status,
    });

  const persistJobOrder = async (
    payload: ReturnType<typeof buildJobOrderPayload>,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = jobOrderId
        ? await fetch(`/api/job-orders/${jobOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/job-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message ?? "Failed to save the job order.");
      }
      if (!jobOrderId) setJobOrderId(result.data.id);
      return { success: true, message: result.message ?? "Saved." };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : "Failed to save the job order." };
    }
  };

  // First "Save Draft" of a wizard session POSTs (no jobOrderId yet); every save after that
  // PATCHes the same record instead of creating a duplicate — the unique procurementNo index
  // would otherwise reject the second POST outright.
  const saveDraft = async (): Promise<{ success: boolean; message: string }> => {
    setIsSavingDraft(true);
    try {
      return await persistJobOrder(buildJobOrderPayload("Draft", step as JobOrderCompletionStep));
    } finally {
      setIsSavingDraft(false);
    }
  };

  // The wizard's final action — always completedStep 3 regardless of which step the button was
  // clicked from (Step 3 is the only step this is reachable on), status flips to "Completed" so
  // the Active table's "Generate Bill" gate (completedStep === 3) unlocks.
  const completeJobOrder = async (): Promise<{ success: boolean; message: string }> => {
    setIsCompleting(true);
    try {
      return await persistJobOrder(buildJobOrderPayload("Completed", 3));
    } finally {
      setIsCompleting(false);
    }
  };

  const value: JobOrderWizardValue = {
    role,
    step,
    goNext,
    goBack,
    goToStep,

    procurementNo,
    procuringEntity,
    procurementOptionsList,
    isLoadingProcurementOptions,
    handleSelectProcurement,

    vatRate,

    sourceDocument,
    uploadSourceDocument,
    removeSourceDocument,

    metadata,
    isParsing,
    handleParse,
    updateMetadataField,

    originalItems,
    items,
    isLoadingItems,
    handleRemoveItem,

    assignedStaffId,
    setAssignedStaffId,
    staffOptionsList,
    isLoadingStaffOptions,

    receipts,
    addReceipts,
    removeReceipt,
    updateReceiptAmount,

    otherExpenses,
    handleAddExpense,
    handleRemoveExpense,
    handleExpenseChange,
    expensesZeroed,
    setExpensesZeroed,

    markupValue,
    markupPercent,
    setMarkupValue: (v) => {
      setProfitSplitBasis("markup");
      setMarkupMode("value");
      setMarkupValueInput(v);
    },
    setMarkupPercent: (p) => {
      setProfitSplitBasis("markup");
      setMarkupMode("percentage");
      setMarkupPercentInput(p);
    },

    commissionValue,
    commissionPercent,
    setCommissionValue: (v) => {
      setProfitSplitBasis("commission");
      setCommissionMode("value");
      setCommissionValueInput(v);
    },
    setCommissionPercent: (p) => {
      setProfitSplitBasis("commission");
      setCommissionMode("percentage");
      setCommissionPercentInput(p);
    },
    commissionZeroed,
    setCommissionZeroed,

    originalTotal,
    newTotal,
    receiptsTotal,
    manualExpensesTotal,
    otherExpensesTotal,
    profitBase,

    canProceedFromStep1: Boolean(procurementNo) && items.length > 0,

    jobOrderId,
    isLoadingJobOrder,
    isSavingDraft,
    saveDraft,
    isCompleting,
    completeJobOrder,
  };

  return <JobOrderWizardContext.Provider value={value}>{children}</JobOrderWizardContext.Provider>;
}

export function useJobOrderWizard() {
  const ctx = useContext(JobOrderWizardContext);
  if (!ctx) throw new Error("useJobOrderWizard must be used within a JobOrderWizardProvider");
  return ctx;
}
