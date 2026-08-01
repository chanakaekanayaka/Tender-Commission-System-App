import { T } from "@/components/features/i18n/T";
import { StaffPendingCommissions } from "@/components/features/commissions/StaffPendingCommissions";
import connectDB from "@/lib/db/connectDB";
import { JobOrderModel } from "@/lib/db/models/JobOrder.model";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getSignedImageUrl } from "@/lib/aws/s3";
import { formatDateTime } from "@/lib/utils/date";
import { getNewTotal, getProfitBase } from "@/lib/utils/jobOrderExpenses";
import { percentFromValue } from "@/lib/utils/pricing";
import type { StaffPendingCommission } from "@/shared/types/commission.types";

export default async function CommissionPendingPage() {
  const user = await getCurrentUser();
  await connectDB();
  // Staff sees only their own records — AI_INSTRUCTIONS.md §3. Same gate as Admin's own Commissions
  // Pending, covering both stages so Staff can see the full lifecycle, not just the final step: bill
  // and payment proof verified, commission not yet confirmed or rejected, independent of whether the
  // procuring entity's payment has been marked fully complete yet.
  const [records, systemConfig] = await Promise.all([
    JobOrderModel.find({
      billVerifiedAt: { $ne: null },
      paymentProofVerifiedAt: { $ne: null },
      commissionPaymentConfirmedAt: null,
      commissionRejectedAt: null,
      invoiceId: null,
      ...(user ? { createdBy: user._id } : {}),
    }).sort({ billVerifiedAt: -1 }),
    getOrCreateSystemConfig(),
  ]);
  const vatRate = systemConfig.isVatRegistered ? systemConfig.vatPercentage / 100 : 0;

  const data: StaffPendingCommission[] = await Promise.all(
    records.map(async (record) => {
      const profit = getProfitBase(record, vatRate);
      // Sales Commission is calculated against New Total, not Profit (see JobOrderWizardContext) —
      // the rate shown here has to use the same base, or it won't match what was actually typed in
      // the wizard.
      const newTotal = getNewTotal(record, vatRate);
      return {
        id: record._id.toString(),
        jobOrderNo: record.jobOrderNo,
        profit,
        commissionRate: Math.round(percentFromValue(newTotal, record.commissionValue)),
        calculatedCommission: record.commissionValue,
        uploadedAt: record.commissionPaymentProof ? formatDateTime(record.commissionPaymentProof.uploadedAt) : null,
        paymentProofName: record.commissionPaymentProof?.fileName ?? null,
        paymentProofType: record.commissionPaymentProof?.fileType ?? null,
        paymentProofUrl: record.commissionPaymentProof
          ? await getSignedImageUrl(record.commissionPaymentProof.s3Key)
          : null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="commissions.pendingHeading" />
      </h1>

      <StaffPendingCommissions data={data} />
    </div>
  );
}
