"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  jobOrderMetadataByProcurement,
  procurementLineItems,
  procurementOptions,
  staffOptions,
} from "@/lib/mock/jobOrders.mock";
import { calculateLineItemTotals, percentFromValue, valueFromPercent } from "@/lib/utils/pricing";
import type {
  AmountInputMode,
  JobOrderLineItem,
  JobOrderMetadata,
  OtherExpenseItem,
  ReceiptItem,
} from "@/shared/types/job-order.types";

const EMPTY_METADATA: JobOrderMetadata = { address: "", telephone: "", email: "", note: "" };

const sumSubTotals = (items: JobOrderLineItem[]) =>
  items.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice).subTotal, 0);

let idSeq = 0;
const nextId = (prefix: string) => `${prefix}-${++idSeq}`;

interface JobOrderWizardValue {
  role: "admin" | "staff";
  step: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;

  procurementNo: string;
  procurementOptionsList: typeof procurementOptions;
  handleSelectProcurement: (procurementNo: string) => void;

  metadata: JobOrderMetadata;
  isParsing: boolean;
  handleParse: () => void;

  originalItems: JobOrderLineItem[];
  items: JobOrderLineItem[];
  handleRemoveItem: (id: string) => void;

  assignedStaffId: string;
  setAssignedStaffId: (id: string) => void;
  staffOptionsList: typeof staffOptions;

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
  profit: number;

  canProceedFromStep1: boolean;
}

const JobOrderWizardContext = createContext<JobOrderWizardValue | null>(null);

export function JobOrderWizardProvider({
  role,
  children,
}: {
  role: "admin" | "staff";
  children: ReactNode;
}) {
  const [step, setStep] = useState(1);

  const [procurementNo, setProcurementNo] = useState("");
  const [metadata, setMetadata] = useState<JobOrderMetadata>(EMPTY_METADATA);
  const [isParsing, setIsParsing] = useState(false);
  const [originalItems, setOriginalItems] = useState<JobOrderLineItem[]>([]);
  const [items, setItems] = useState<JobOrderLineItem[]>([]);
  // Staff has no auth/session yet (AGENTS.md — UI-only mock phase), so a staff
  // user's own "assignment" is stood in for by the first mock staff option.
  const [assignedStaffId, setAssignedStaffId] = useState(role === "staff" ? staffOptions[0].id : "");

  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>([]);
  const [expensesZeroed, setExpensesZeroed] = useState(false);

  const [markupMode, setMarkupMode] = useState<AmountInputMode>("percentage");
  const [markupPercentInput, setMarkupPercentInput] = useState(0);
  const [markupValueInput, setMarkupValueInput] = useState(0);

  const [commissionMode, setCommissionMode] = useState<AmountInputMode>("percentage");
  const [commissionPercentInput, setCommissionPercentInput] = useState(0);
  const [commissionValueInput, setCommissionValueInput] = useState(0);
  const [commissionZeroed, setCommissionZeroed] = useState(false);

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
  };

  // Placeholder for the real Gemini OCR extraction (AI_INSTRUCTIONS.md Workflow A).
  // No backend call exists yet — this simulates the delay and fills mock data
  // keyed off the already-selected procurement no.
  const handleParse = () => {
    if (!procurementNo) return;
    setIsParsing(true);
    setTimeout(() => {
      const lineItems = procurementLineItems[procurementNo] ?? [];
      setOriginalItems(lineItems);
      setItems(lineItems);
      setMetadata(jobOrderMetadataByProcurement[procurementNo] ?? EMPTY_METADATA);
      setIsParsing(false);
    }, 1200);
  };

  const handleRemoveItem = (id: string) => setItems((prev) => prev.filter((row) => row.id !== id));

  const addReceipts = (files: File[]) => {
    setReceipts((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nextId("receipt"),
        fileName: file.name,
        amount: 0,
        fileType: file.type,
        // Real, in-browser preview of the actual uploaded file — must be revoked
        // (below, and on procurement change / provider unmount) to avoid leaking it.
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
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

  const originalTotal = sumSubTotals(originalItems);
  const newTotal = sumSubTotals(items);

  const receiptsTotal = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const manualExpensesTotal = expensesZeroed
    ? 0
    : otherExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const otherExpensesTotal = receiptsTotal + manualExpensesTotal;

  const markupValue =
    markupMode === "percentage" ? valueFromPercent(newTotal, markupPercentInput) : markupValueInput;
  const markupPercent =
    markupMode === "percentage" ? markupPercentInput : percentFromValue(newTotal, markupValueInput);

  const commissionValue = commissionZeroed
    ? 0
    : commissionMode === "percentage"
      ? valueFromPercent(newTotal, commissionPercentInput)
      : commissionValueInput;
  const commissionPercent = commissionZeroed
    ? 0
    : commissionMode === "percentage"
      ? commissionPercentInput
      : percentFromValue(newTotal, commissionValueInput);

  const profit = markupValue - (commissionValue + otherExpensesTotal);

  const value: JobOrderWizardValue = {
    role,
    step,
    goNext,
    goBack,
    goToStep,

    procurementNo,
    procurementOptionsList: procurementOptions,
    handleSelectProcurement,

    metadata,
    isParsing,
    handleParse,

    originalItems,
    items,
    handleRemoveItem,

    assignedStaffId,
    setAssignedStaffId,
    staffOptionsList: staffOptions,

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
      setMarkupMode("value");
      setMarkupValueInput(v);
    },
    setMarkupPercent: (p) => {
      setMarkupMode("percentage");
      setMarkupPercentInput(p);
    },

    commissionValue,
    commissionPercent,
    setCommissionValue: (v) => {
      setCommissionMode("value");
      setCommissionValueInput(v);
    },
    setCommissionPercent: (p) => {
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
    profit,

    canProceedFromStep1: Boolean(procurementNo) && items.length > 0,
  };

  return <JobOrderWizardContext.Provider value={value}>{children}</JobOrderWizardContext.Provider>;
}

export function useJobOrderWizard() {
  const ctx = useContext(JobOrderWizardContext);
  if (!ctx) throw new Error("useJobOrderWizard must be used within a JobOrderWizardProvider");
  return ctx;
}
