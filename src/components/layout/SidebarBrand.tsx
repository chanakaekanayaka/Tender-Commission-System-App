import connectDB from "@/lib/db/connectDB";
import { getOrCreateSystemConfig } from "@/lib/db/models/SystemConfig.model";
import { getSignedImageUrl } from "@/lib/aws/s3";

/**
 * Sidebar header for both portals — the uploaded company logo (see SystemConfig's Logo section)
 * when Admin has set one, falling back to the plain "TENDER-CMS" text otherwise. A Server
 * Component so both AdminSidebar and StaffSidebar render the exact same real data without either
 * duplicating the fetch.
 */
export async function SidebarBrand() {
  await connectDB();
  const config = await getOrCreateSystemConfig();
  const logoUrl = config.logo ? await getSignedImageUrl(config.logo.s3Key) : null;

  return (
    <div className="flex h-12 items-center justify-center overflow-hidden rounded-none border border-white/10">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, not a static asset
        <img src={logoUrl} alt="" className="h-full max-w-full object-contain p-1" />
      ) : (
        <p className="text-sm font-bold tracking-wide">TENDER-CMS</p>
      )}
    </div>
  );
}
