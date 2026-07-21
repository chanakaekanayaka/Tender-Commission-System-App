import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the on-screen dev-mode route indicator badge. Dev-only cosmetic
  // overlay — compile/runtime errors still surface normally.
  devIndicators: false,
  // pdfkit reads its font metric files from disk at runtime (fs.readFileSync relative to its own
  // package folder) — Route Handler webpack bundling breaks that lookup, so it must stay a native
  // require instead of being bundled (price-schedules export-to-PDF route).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
