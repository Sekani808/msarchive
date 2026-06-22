// src/app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, CreditCard, KeyRound, Settings, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Stories", href: "/admin/stories", icon: BookOpen },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Unlock Codes", href: "/admin/codes", icon: KeyRound },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
    // If the user is on the login page, DO NOT show the sidebar.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="flex h-screen bg-navy-dark text-gray-light overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-white/5 p-4">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-soft">
            Msarchive
          </h1>
          <p className="text-xs text-gray-light/50 mt-1">Admin Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "text-navy-dark" : "text-gray-light/70 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAdminNav"
                    className="absolute inset-0 bg-brand rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-brand">Msarchive Admin</h1>
          <button onClick={handleLogout} className="p-2 text-red-400">
            <LogOut size={20} />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}