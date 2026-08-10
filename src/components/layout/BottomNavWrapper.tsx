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

  return (
    <>
      {/* Spacer to prevent fixed BottomNav from overlapping content globally */}
      <div className="h-24 md:h-20 pb-[env(safe-area-inset-bottom)]" aria-hidden="true" />
      <BottomNav />
    </>
  );
}