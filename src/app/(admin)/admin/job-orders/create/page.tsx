import { T } from "@/components/features/i18n/T";
import { JobOrderStepper } from "@/components/features/job-orders/JobOrderStepper";

interface AdminJobOrderCreatePageProps {
  searchParams: Promise<{ step?: string; id?: string }>;
}

export default async function AdminJobOrderCreatePage({ searchParams }: AdminJobOrderCreatePageProps) {
  const { step, id } = await searchParams;
  const parsedStep = step ? Number(step) : NaN;
  const initialStep = Number.isFinite(parsedStep) ? parsedStep : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="jobOrderCreate.heading" />
        </h1>
      </div>

      <JobOrderStepper role="admin" initialStep={initialStep} jobOrderId={id} />
    </div>
  );
}
