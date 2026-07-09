import { T } from "@/components/features/i18n/T";
import { SystemConfig } from "@/components/features/system-config/SystemConfig";

export default function AdminSystemConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="systemConfig.heading" />
        </h1>
      </div>

      <SystemConfig />
    </div>
  );
}
