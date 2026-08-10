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
    <nav 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
      aria-label="Main navigation"
    >
      <div className="glass rounded-2xl px-2 py-2 flex justify-between items-center shadow-xl border border-white/5">
        {navItems.map((item) => {
          // Exact match for Home, startsWith for others to handle /reading vs /read/[id]
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.href);
            
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors"
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-brand/15 rounded-xl border border-brand/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              <Icon
                size={20}
                className={`relative z-10 transition-colors duration-200 ${
                  isActive ? "text-brand" : "text-gray-light/60"
                }`}
              />
              <span 
                className={`relative z-10 text-[9px] mt-0.5 font-medium transition-colors duration-200 ${
                  isActive ? "text-brand" : "text-gray-light/60"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}