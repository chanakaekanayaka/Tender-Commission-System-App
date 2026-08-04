import { T } from "@/components/features/i18n/T";
import { AdminPendingCommissions } from "@/components/features/commissions/AdminPendingCommissions";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { UserModel } from "@/lib/db/models/User.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getNewTotal, getProfitBase } from "@/lib/utils/jobOrderExpenses";
import { percentFromValue } from "@/lib/utils/pricing";
import { paginateFind, parsePageParam } from "@/lib/db/pagination";
import { findStaffIdsByName } from "@/lib/db/staffSearch";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/pagination";
import type { AdminPendingCommission } from "@/shared/types/commission.types";

interface AdminCommissionsPendingPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function AdminCommissionsPendingPage({ searchParams }: AdminCommissionsPendingPageProps) {
  const { search = "", page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  await connectDB();
  // Every job order whose bill AND payment proof have been verified but whose commission payment
  // hasn't been confirmed by Staff yet — deliberately independent of paymentVerifiedAt (the separate
  // "Payment Complete" confirmation), since Staff can be paid their commission before the procuring
  // entity's payment is marked fully complete. Covers both stages in one table (see
  // AdminPendingCommission's own doc comment): still-unpaid rows (Upload/Reject are live) and
  // already-paid-but-unconfirmed rows (read-only, awaiting Staff — see confirm-commission-payment).
  // Bundled-into-an-invoice ones are excluded — see invoiceId (they're resolved together when that
  // invoice is paid instead).
  const staffIds = await findStaffIdsByName(search);
  const [{ rows: records, total, totalPages, page: currentPage }, systemConfig] = await Promise.all([
    paginateFind(
      JobOrderModel,
      {
        billVerifiedAt: { $ne: null },
        paymentProofVerifiedAt: { $ne: null },
        commissionPaymentConfirmedAt: null,
        commissionRejectedAt: null,
        invoiceId: null,
      },
      ["jobOrderNo"],
      { search, page, limit: DEFAULT_PAGE_SIZE },
      { billVerifiedAt: -1 },
      staffIds.length ? [{ createdBy: { $in: staffIds } }] : [],
    ),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const rowCreatorIds = [...new Set(records.map((record) => record.createdBy.toString()))];
  const staffUsers = await UserModel.find({ _id: { $in: rowCreatorIds } });
  const staffNameById = new Map(staffUsers.map((user) => [user._id.toString(), `${user.firstName} ${user.lastName}`]));

  const data: AdminPendingCommission[] = records.map((record) => {
    const profit = getProfitBase(record, vatRate);
    // Sales Commission is calculated against New Total, not Profit (see JobOrderWizardContext) —
    // the rate shown here has to use the same base, or it won't match what was actually typed in
    // the wizard.
    const newTotal = getNewTotal(record, vatRate);
    return {
      id: record._id.toString(),
      staffName: staffNameById.get(record.createdBy.toString()) ?? "—",
      jobOrderNo: record.jobOrderNo,
      profit,
      commissionRate: Math.round(percentFromValue(newTotal, record.commissionValue)),
      calculatedCommission: record.commissionValue,
      awaitingStaffConfirmation: record.commissionPaidAt !== null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <AdminPendingCommissions
        data={data}
        search={search}
        page={currentPage}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
