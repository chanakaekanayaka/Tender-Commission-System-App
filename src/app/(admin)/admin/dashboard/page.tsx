import { MonthlySalesTargetCard } from "@/components/features/dashboard/MonthlySalesTargetCard";
import { PerformanceChart } from "@/components/features/dashboard/PerformanceChart";
import { TotalPendingOrdersCard } from "@/components/features/dashboard/TotalPendingOrdersCard";
import { TotalPendingPaymentsCard } from "@/components/features/dashboard/TotalPendingPaymentsCard";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderDocument, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { formatCompactLKR, formatLKR } from "@/lib/utils/currency";
import { calculateDueDate, isPaymentOverdue } from "@/lib/utils/dueDate";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { formatDateOnly, getRecentSriLankaMonths, getSriLankaDaysRemainingInMonth } from "@/lib/utils/date";
import type {
  MonthlySalesTargetOrderRow,
  MonthlyPerformance,
  TotalPendingOrderRow,
  TotalPendingPaymentRow,
} from "@/types/dashboard";

const PERFORMANCE_MONTHS = 12;

export default async function AdminDashboardPage() {
  await connectDB();

  const recentMonths = getRecentSriLankaMonths(PERFORMANCE_MONTHS);
  const earliestMonthStart = recentMonths[0].start;

  const [staffUsers, jobOrdersLast12Months, pendingPaymentOrders, totalPendingOrderRecords, systemConfig] =
    await Promise.all([
      UserModel.find({ role: "Staff", status: "Active" }),
      JobOrderModel.find({ createdAt: { $gte: earliestMonthStart }, deletedAt: null }),
      // Same real gate Admin's own Job Orders > Pending tab uses — awaiting the procuring entity's
      // payment, company-wide.
      JobOrderModel.find({ billVerifiedAt: { $ne: null }, paymentVerifiedAt: null }),
      // Anything not yet in History — Active + Pending combined, company-wide.
      JobOrderModel.find({ paymentVerifiedAt: null, deletedAt: null }).sort({ createdAt: -1 }),
      getOrCreateSystemConfig(),
    ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;
  const sumSubTotals = (rows: JobOrderLineItemSubdoc[]) =>
    rows.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal, 0);
  const salesValue = (record: JobOrderDocument) => sumSubTotals(record.lineItems);

  // Company-wide target: no separate "company target" field exists, so this is the sum of every
  // active Staff member's own monthlyTarget — the real target figures the system already tracks.
  // Applied uniformly across every month on the trend chart too, since monthlyTarget has no
  // historical record of its own — only the current value is ever known.
  const target = staffUsers.reduce((sum, user) => sum + user.monthlyTarget, 0);

  const currentMonth = recentMonths.at(-1)!;
  const jobOrdersThisMonth = jobOrdersLast12Months.filter(
    (record) => record.createdAt >= currentMonth.start && record.createdAt < currentMonth.end,
  );
  // Achieved: total sales value (line items, VAT included) of every Job Order created this month,
  // company-wide — not scoped to any one Staff member, since this is a company KPI.
  const achieved = jobOrdersThisMonth.reduce((sum, record) => sum + salesValue(record), 0);
  const progressPercent = target > 0 ? Math.round(Math.min(1, achieved / target) * 100) : 0;
  const daysRemaining = getSriLankaDaysRemainingInMonth();

  const monthlySalesTargetValue = `${formatCompactLKR(achieved)} / ${formatCompactLKR(target)}`;
  const monthlySalesTargetHelperText = `${progressPercent}% achieved · ${daysRemaining} days left`;

  const creatorIds = [...new Set(jobOrdersThisMonth.map((record) => record.createdBy.toString()))];
  const creators = await UserModel.find({ _id: { $in: creatorIds } });
  const staffNameById = new Map(creators.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const monthlySalesTargetOrders: MonthlySalesTargetOrderRow[] = jobOrdersThisMonth
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      procuringEntity: record.procuringEntity,
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
      total: salesValue(record),
      createdDate: formatDateOnly(record.createdAt),
    }));

  // Month-by-Month Company Performance — real sales per month (line items, VAT included) across
  // the last 12 Sri Lanka calendar months, against the current company target held flat since
  // there's no historical target to plot instead.
  const companyMonthlyPerformance: MonthlyPerformance[] = recentMonths.map(({ label, start, end }) => ({
    month: label,
    sales: jobOrdersLast12Months
      .filter((record) => record.createdAt >= start && record.createdAt < end)
      .reduce((sum, record) => sum + salesValue(record), 0),
    target,
  }));

  // What the procuring entities still owe — the bill amount, not the expenses/staff-payout figure
  // the Pending page's own "Amount" column shows.
  const totalPendingPayments = pendingPaymentOrders.reduce((sum, record) => sum + (record.billAmount ?? 0), 0);
  const totalPendingPaymentsValue = formatLKR(totalPendingPayments);
  const totalPendingPaymentsHelperText = `across ${pendingPaymentOrders.length} job orders`;

  const totalPendingPaymentOrders: TotalPendingPaymentRow[] = pendingPaymentOrders.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    procuringEntity: record.procuringEntity,
    billAmount: record.billAmount ?? 0,
    // Same bare "YYYY-MM-DD" (UTC-sliced) convention AdminPendingTable itself feeds into
    // calculateDueDate/isPaymentOverdue.
    billGeneratedDate: record.billDocument!.generatedAt.toISOString().slice(0, 10),
  }));

  const today = new Date();
  const totalPendingOrders: TotalPendingOrderRow[] = totalPendingOrderRecords.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    procuringEntity: record.procuringEntity,
    total: salesValue(record),
    status: record.billVerifiedAt ? "Pending" : "Active",
    billGeneratedDate: record.billDocument ? record.billDocument.generatedAt.toISOString().slice(0, 10) : undefined,
  }));
  const overdueOrdersCount = totalPendingOrders.filter(
    (row) => row.billGeneratedDate && isPaymentOverdue(calculateDueDate(row.billGeneratedDate, systemConfig.paymentDueDays), today),
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Company Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MonthlySalesTargetCard
          value={monthlySalesTargetValue}
          helperText={monthlySalesTargetHelperText}
          progressPercent={progressPercent}
          orders={monthlySalesTargetOrders}
        />
        <TotalPendingPaymentsCard
          value={totalPendingPaymentsValue}
          helperText={totalPendingPaymentsHelperText}
          orders={totalPendingPaymentOrders}
          paymentDueDays={systemConfig.paymentDueDays}
        />
        <TotalPendingOrdersCard
          orders={totalPendingOrders}
          overdueCount={overdueOrdersCount}
          paymentDueDays={systemConfig.paymentDueDays}
        />
      </div>

      <PerformanceChart data={companyMonthlyPerformance} highlightMonth={currentMonth.label} />
    </div>
  );
}
