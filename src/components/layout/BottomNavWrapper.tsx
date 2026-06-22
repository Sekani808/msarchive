// src/components/layout/BottomNavWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function BottomNavWrapper() {
  const pathname = usePathname();

  // Hide the bottom nav on Admin pages AND Reading pages
  if (pathname.startsWith("/admin") || pathname.startsWith("/read")) {
    return null;
  }

  return <BottomNav />;
}