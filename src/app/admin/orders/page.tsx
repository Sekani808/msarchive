"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, TrendingUp, Clock, MessageCircle, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { HardCopyOrder, HardCopyOrderStatus } from "@/types/hardCopyOrder";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";

interface OrderWithStory extends HardCopyOrder {
  stories: { title: string; cover_image: string } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithStory | null>(null);
  const [filterStatus, setFilterStatus] = useState<HardCopyOrderStatus | "all">("all");

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("hard_copy_orders")
      .select("*, stories(title, cover_image)")
      .order("created_at", { ascending: false });

    if (data) {
      setOrders(data as OrderWithStory[]);
      
      const pending = data.filter(o => o.status === "pending").length;
      const revenue = data
        .filter(o => o.status !== "cancelled")
        .reduce((acc, o) => acc + (o.total_price_mwk || 0), 0);

      setStats({
        totalOrders: data.length,
        pendingOrders: pending,
        totalRevenue: revenue,
      });
    }
    setIsLoading(false);
  };

  const filteredOrders = orders.filter(order => 
    filterStatus === "all" || order.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "contacted": return "bg-blue-500/20 text-blue-400";
      case "confirmed": return "bg-brand/20 text-brand";
      case "delivered": return "bg-green-500/20 text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-white/10 text-gray-light";
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-light/50">Loading orders...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Physical Orders</h1>
        <p className="text-gray-light/60 mt-1">Manage hard-copy book orders and fulfillment.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Total Orders</p>
            <ShoppingBag className="text-brand" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Pending Fulfillment</p>
            <Clock className="text-yellow-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.pendingOrders}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Hardcopy Revenue</p>
            <TrendingUp className="text-accent-purple" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRevenue.toLocaleString()} MWK</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <Filter size={18} className="text-gray-light/50" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="glass rounded-lg py-2 px-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ShoppingBag className="mx-auto text-gray-light/30 mb-4" size={48} />
          <p className="text-gray-light/50">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedOrder(order)}
              className="glass rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <img 
                src={order.stories?.cover_image || "/placeholder.jpg"} 
                alt="Cover" 
                className="w-12 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{order.stories?.title || "Unknown Story"}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-light/60 mt-1">
                  <span>{order.customer_name}</span>
                  <span>•</span>
                  <span>{order.quantity} {order.quantity === 1 ? 'copy' : 'copies'}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-brand">
                  {order.total_price_mwk.toLocaleString()} MWK
                </p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => {
            fetchOrders();
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}