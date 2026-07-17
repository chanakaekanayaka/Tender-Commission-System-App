import { T } from "@/components/features/i18n/T";
import { SystemConfig } from "@/components/features/system-config/SystemConfig";
import connectDB from "@/lib/db/connectDB";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { defaultSystemConfig } from "@/lib/mock/systemConfig.mock";

export default async function AdminSystemConfigPage() {
  await connectDB();
  const config = await getOrCreateSystemConfig();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">
          <T k="systemConfig.heading" />
        </h1>
      </div>

      <SystemConfig
        initialValues={{
          ...defaultSystemConfig,
          isVatRegistered: config.isVatRegistered,
          vatPercentage: config.vatPercentage,
        }}
      />
    </div>
  );
}
