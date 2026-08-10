// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  BookOpen, ShoppingBag, Package, MessageSquare, DollarSign, 
  AlertTriangle, ArrowRight, Plus, FileText, KeyRound, TrendingUp 
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardStats {
  totalRevenue: number;
  pendingOrders: number;
  lowStockItems: number;
  hiddenComments: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total_price_mwk: number;
  status: string;
  created_at: string;
  stories: { title: string } | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    hiddenComments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);

    try {
      // 1. Fetch Revenue from Ledger View
      const { data: ledgerData } = await supabase
        .from("v_sales_ledger")
        .select("amount_mwk");
      
      const totalRevenue = ledgerData?.reduce((acc, curr) => acc + (curr.amount_mwk || 0), 0) || 0;

      // 2. Fetch Pending Orders
      const { count: pendingOrders } = await supabase
        .from("hard_copy_orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // 3. Fetch Low Stock Items (Client-side filter for column comparison)
      const { data: inventoryData } = await supabase
        .from("inventory_items")
        .select("current_stock, low_stock_threshold");
      
      const lowStockItems = inventoryData?.filter(item => item.current_stock <= item.low_stock_threshold).length || 0;

      // 4. Fetch Hidden Comments
      const { count: hiddenComments } = await supabase
        .from("story_comments")
        .select("*", { count: "exact", head: true })
        .eq("status", "hidden");

      // 5. Fetch Recent Orders
      const { data: ordersData } = await supabase
        .from("hard_copy_orders")
        .select("*, stories(title)")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        lowStockItems,
        hiddenComments: hiddenComments || 0,
      });
      setRecentOrders((ordersData as RecentOrder[]) || []);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { 
      title: "Total Revenue", 
      value: `${stats.totalRevenue.toLocaleString()} MWK`, 
      icon: DollarSign, 
      color: "text-brand bg-brand/10", 
      link: "/admin/reports" 
    },
    { 
      title: "Pending Orders", 
      value: stats.pendingOrders, 
      icon: ShoppingBag, 
      color: "text-yellow-400 bg-yellow-400/10", 
      link: "/admin/orders" 
    },
    { 
      title: "Low Stock Alerts", 
      value: stats.lowStockItems, 
      icon: AlertTriangle, 
      color: "text-red-400 bg-red-400/10", 
      link: "/admin/inventory" 
    },
    { 
      title: "Hidden Comments", 
      value: stats.hiddenComments, 
      icon: MessageSquare, 
      color: "text-accent-purple bg-accent-purple/10", 
      link: "/admin/comments" 
    },
  ];

  const quickActions = [
    { name: "Upload Story", icon: Plus, href: "/admin/stories/new", color: "bg-brand text-navy-dark" },
    { name: "Generate Codes", icon: KeyRound, href: "/admin/codes", color: "bg-accent-purple text-white" },
    { name: "View Reports", icon: FileText, href: "/admin/reports", color: "bg-accent-blue text-white" },
    { name: "Manage Inventory", icon: Package, href: "/admin/inventory", color: "bg-white/10 text-white" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-light/60 mt-1">Welcome back. Here is your archive overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer h-full"
              >
                <div>
                  <p className="text-sm text-gray-light/60">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon size={24} />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.name} href={action.href}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`w-full p-4 rounded-2xl flex flex-col items-center justify-center gap-3 font-semibold transition-transform active:scale-95 ${action.color}`}
                >
                  <Icon size={24} />
                  <span className="text-sm">{action.name}</span>
                </motion.button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-light/50 text-center py-8">No recent orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-light/50 border-b border-white/5">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Story</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-3 text-white font-medium">{order.customer_name}</td>
                    <td className="py-3 text-gray-light/70">{order.stories?.title || "Unknown"}</td>
                    <td className="py-3 text-white">{order.total_price_mwk.toLocaleString()} MWK</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'confirmed' ? 'bg-brand/20 text-brand' :
                        order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}