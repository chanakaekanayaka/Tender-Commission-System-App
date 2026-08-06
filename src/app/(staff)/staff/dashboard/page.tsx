import { redirect } from "next/navigation";
import { T } from "@/components/features/i18n/T";
import { BiddingTrendChart } from "@/components/features/dashboard/BiddingTrendChart";
import { MonthlyTargetCard } from "@/components/features/dashboard/MonthlyTargetCard";
import { OrdersToCompleteCard } from "@/components/features/dashboard/OrdersToCompleteCard";
import { PendingCommissionCard } from "@/components/features/dashboard/PendingCommissionCard";
import { PriceScheduleChart } from "@/components/features/dashboard/PriceScheduleChart";
import { StaffPerformanceChart } from "@/components/features/dashboard/StaffPerformanceChart";
import { ThisMonthBiddingCard } from "@/components/features/dashboard/ThisMonthBiddingCard";
import { getCurrentUser } from "@/lib/auth/currentUser";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel, type JobOrderLineItemSubdoc } from "@/lib/db/models/JobOrder.model";
import { PriceScheduleModel } from "@/lib/db/models/PriceSchedule.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { calculateLineItemTotals } from "@/lib/utils/pricing";
import { formatDateOnly, getRecentSriLankaMonths, getSriLankaMonthRange } from "@/lib/utils/date";
import type { MonthlyTargetOrderRow, OrderToCompleteRow, PendingCommissionRow, ThisMonthBidRow } from "@/types/dashboard";

const PERFORMANCE_MONTHS = 6;

export default async function StaffDashboardPage() {
  // The layout above already redirects unauthenticated/blocked users — this is just to read the name/target.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();

  const ownership = { $or: [{ createdBy: user._id }, { assignedStaffId: user._id.toString() }] };
  const thisMonth = getSriLankaMonthRange();
  const recentMonths = getRecentSriLankaMonths(PERFORMANCE_MONTHS);
  const earliestMonthStart = recentMonths[0].start;

  const [
    confirmedCommissionRecords,
    createdThisMonthRecords,
    pendingCommissionRecords,
    ordersToCompleteRecords,
    priceScheduleRecords,
    systemConfig,
  ] = await Promise.all([
    // Commission belongs to whoever created the job order — same ownership rule Commissions
    // Pending/History already use, not the broader Active/Pending $or (which also includes
    // Admin-assigned job orders Staff didn't personally earn commission on until it's theirs).
    JobOrderModel.find({ createdBy: user._id, commissionPaymentConfirmedAt: { $gte: earliestMonthStart } }),
    // Monthly Target tracks business generated this month, not when it was eventually paid out —
    // gated on the job order's own createdAt, not commissionPaymentConfirmedAt. Same convention as
    // Admin's own company-wide Monthly Sales Target (see admin/dashboard/page.tsx's `salesValue`):
    // counted the moment it's created, not gated on reaching any later stage.
    JobOrderModel.find({
      createdBy: user._id,
      createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
      deletedAt: null,
    }),
    // Same real gate Commissions Pending itself uses.
    JobOrderModel.find({
      createdBy: user._id,
      billVerifiedAt: { $ne: null },
      paymentProofVerifiedAt: { $ne: null },
      commissionPaymentConfirmedAt: null,
      commissionRejectedAt: null,
      invoiceId: null,
    }),
    // Every job order Staff still has something to do on — i.e. everything that hasn't reached
    // their own Job Orders > History yet (mirrors that page's own gate, inverted: History is
    // `paymentProofVerifiedAt set OR deletedAt set`, so "not there yet" is both null). Covers
    // Active (bill not yet verified) and Pending (bill verified, payment proof not yet verified)
    // in one query, not just Pending alone.
    JobOrderModel.find({
      ...ownership,
      deletedAt: null,
      paymentProofVerifiedAt: null,
    }).sort({ createdAt: -1 }),
    PriceScheduleModel.find({ createdBy: user._id, status: "Completed", createdAt: { $gte: earliestMonthStart } }),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;
  const sumSubTotals = (rows: JobOrderLineItemSubdoc[]) =>
    rows.reduce((sum, row) => sum + calculateLineItemTotals(row.qty, row.unitPrice, vatRate).subTotal, 0);

  // Sales value (line items, VAT included) — same metric Admin's company-wide card sums via its
  // own `salesValue`, not commission (that's a personal earnings figure, not business generated).
  const salesValue = (record: (typeof createdThisMonthRecords)[number]) => sumSubTotals(record.lineItems);
  const achievedAmount = createdThisMonthRecords.reduce((sum, record) => sum + salesValue(record), 0);
  const monthlyTargetOrders: MonthlyTargetOrderRow[] = createdThisMonthRecords
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((record) => ({
      id: record._id.toString(),
      jobOrderNo: record.jobOrderNo,
      procurementNo: record.procurementNo,
      procuringEntity: record.procuringEntity,
      total: salesValue(record),
      createdDate: formatDateOnly(record.createdAt),
    }));
  const pendingCommissionOrders: PendingCommissionRow[] = pendingCommissionRecords.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    procuringEntity: record.procuringEntity,
    commissionValue: record.commissionValue,
  }));

  const ordersToComplete: OrderToCompleteRow[] = ordersToCompleteRecords.map((record) => ({
    id: record._id.toString(),
    jobOrderNo: record.jobOrderNo,
    procurementNo: record.procurementNo,
    procuringEntity: record.procuringEntity,
    total: sumSubTotals(record.lineItems),
  }));

  const staffMonthlyPerformance = recentMonths.map(({ label, start, end }) => ({
    month: label,
    amount: confirmedCommissionRecords
      .filter((record) => record.commissionPaymentConfirmedAt! >= start && record.commissionPaymentConfirmedAt! < end)
      .reduce((sum, record) => sum + record.commissionValue, 0),
  }));

  const priceScheduleTrend = recentMonths.map(({ label, start, end }) => ({
    month: label,
    count: priceScheduleRecords.filter((record) => record.createdAt >= start && record.createdAt < end).length,
  }));

  const thisMonthBids: ThisMonthBidRow[] = priceScheduleRecords
    .filter((record) => record.createdAt >= thisMonth.start && record.createdAt < thisMonth.end)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((record) => ({
      id: record._id.toString(),
      procurementNo: record.procurementNo,
      procurementTitle: record.procurementTitle,
      procuringEntity: record.procuringEntity,
      totalValue: record.totalValue,
      createdDate: formatDateOnly(record.createdAt),
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="dashboard.greeting" values={{ name: user.firstName }} />
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MonthlyTargetCard
          label={<T k="dashboard.monthlyTarget" />}
          targetAmount={user.monthlyTarget}
          achievedAmount={achievedAmount}
          orders={monthlyTargetOrders}
        />
        <PendingCommissionCard orders={pendingCommissionOrders} />
        <OrdersToCompleteCard orders={ordersToComplete} />
        <ThisMonthBiddingCard bids={thisMonthBids} />
      </div>

      <div className="rounded-none border border-border bg-card p-4">
        <h2 className="font-semibold text-ink">
          <T k="dashboard.myPerformance" />
        </h2>
        <div className="mt-4 h-64">
          <StaffPerformanceChart data={staffMonthlyPerformance} />
        </div>
      </div>

      <div className="rounded-none border border-border bg-card p-4">
        <h2 className="font-semibold text-ink">
          <T k="dashboard.biddingChartHeading" />
        </h2>
        <div className="mt-4">
          <BiddingTrendChart data={priceScheduleTrend} />
        </div>
      </div>

      <PriceScheduleChart data={priceScheduleTrend} />
    </div>
  );
}
