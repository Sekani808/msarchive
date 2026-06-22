import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development", 
});

const nextConfig: NextConfig = {
  turbopack: {}, // This line fixes the Next.js 16 Turbopack error
};

export default withPWA(nextConfig);