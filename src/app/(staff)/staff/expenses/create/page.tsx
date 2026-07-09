import { T } from "@/components/features/i18n/T";
import { OtherExpenseForm } from "@/components/features/other-expenses/OtherExpenseForm";

export default function StaffExpenseCreatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">
        <T k="otherExpenses.createHeading" />
      </h1>

      <OtherExpenseForm />
    </div>
  );
}
