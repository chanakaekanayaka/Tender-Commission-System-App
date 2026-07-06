import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the on-screen dev-mode route indicator badge. Dev-only cosmetic
  // overlay — compile/runtime errors still surface normally.
  devIndicators: false,
};

export default nextConfig;
