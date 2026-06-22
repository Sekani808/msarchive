// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Library, BookOpen, Info, HelpCircle } from "lucide-react";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Library", href: "/library", icon: Library },
  { name: "Reading", href: "/reading", icon: BookOpen },
  { name: "About", href: "/about", icon: Info },
  { name: "Help", href: "/search", icon: HelpCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
      <div className="glass rounded-2xl px-4 py-3 flex justify-between items-center shadow-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-12 h-12"
            >
              {/* Animated background for active state */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-brand/20 rounded-xl border border-brand/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon
                size={22}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? "text-brand" : "text-gray-light/60"
                } ${item.name === "Help" && pathname !== "/search" ? "animate-throb" : ""}`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}