// src/app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, BookOpen, CreditCard, KeyRound, Settings, LogOut, 
  ShoppingBag, MessageSquare, BarChart3, Package, FileText, 
  Menu, X, ChevronLeft, ChevronRight 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Content",
    items: [
      { name: "Stories", href: "/admin/stories", icon: BookOpen },
      { name: "Comments", href: "/admin/comments", icon: MessageSquare },
      { name: "Reports", href: "/admin/reports", icon: FileText },
    ]
  },
  {
    title: "Commerce",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Inventory", href: "/admin/inventory", icon: Package },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Unlock Codes", href: "/admin/codes", icon: KeyRound },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const NavLinks = ({ collapsed = false, onClick = () => {} }: { collapsed?: boolean; onClick?: () => void }) => (
    <nav className="flex-1 px-3 space-y-6">
      {navGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          {!collapsed && (
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              {group.title}
            </h3>
          )}
          {group.items.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClick}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAdminNav"
                    className="absolute inset-0 bg-emerald-500/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={`relative z-10 flex-shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-gray-500 group-hover:text-white"}`} />
                {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-navy-dark border border-white/10 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-lg">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-navy-dark">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-navy border-b border-white/5 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-light hover:text-white">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Msarchive Admin</h1>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-navy border-r border-white/5 flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Msarchive</h1>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 text-gray-light hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <NavLinks onClick={() => setIsMobileOpen(false)} />
              </div>
              <div className="p-4 border-t border-white/5">
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={20} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-navy border-r border-white/5 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <div className={`h-16 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-6"} border-b border-white/5`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Msarchive</h1>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <NavLinks collapsed={isCollapsed} />
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout} 
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`pt-16 md:pt-0 min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}