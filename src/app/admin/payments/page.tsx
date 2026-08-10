// src/app/admin/payments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, TrendingUp, CreditCard, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

interface Payment {
  id: string;
  code: string;
  story_id: string;
  purchaser_name: string; 
  devices_used: number;
  redeemed_at: string | null;
  price_at_redemption_mwk: number | null;
  created_at: string;
  stories?: { title: string; price_mwk: number };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("unlock_codes")
      .select("*, stories(title, price_mwk)")
      .gte("devices_used", 1)
      .eq("is_revoked", false) 
      .order("redeemed_at", { ascending: false, nullsFirst: false });

    if (data) {
      setPayments(data as Payment[]);
      
      const totalRevenue = data.reduce((acc, payment) => {
        // Use historical price if available, fallback to current story price for old codes
        const price = (payment as any).price_at_redemption_mwk ?? payment.stories?.price_mwk ?? 0;
        return acc + price;
      }, 0);
      
      setStats({
        totalRevenue,
        totalTransactions: data.length,
        avgTransaction: data.length > 0 ? Math.round(totalRevenue / data.length) : 0,
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <p className="text-gray-light/50 animate-pulse">Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Payments</h1>
        <p className="text-gray-light/60 text-sm sm:text-base">Track revenue and transactions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-white/5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-light/70">Total Revenue</p>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="text-emerald-400" size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {stats.totalRevenue.toLocaleString()} <span className="text-base font-normal text-gray-light/50">MWK</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 border border-white/5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-light/70">Total Transactions</p>
            <div className="p-2 rounded-lg bg-accent-blue/10">
              <CreditCard className="text-accent-blue" size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {stats.totalTransactions.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 border border-white/5 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-light/70">Avg. Transaction</p>
            <div className="p-2 rounded-lg bg-accent-purple/10">
              <TrendingUp className="text-accent-purple" size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {stats.avgTransaction.toLocaleString()} <span className="text-base font-normal text-gray-light/50">MWK</span>
          </p>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/5 shadow-xl">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Transactions</h2>
        
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="text-gray-light/40" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No transactions yet</h3>
            <p className="text-gray-light/50 text-sm">When users purchase stories, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, index) => {
              const price = payment.price_at_redemption_mwk ?? payment.stories?.price_mwk ?? 0;
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start justify-between gap-4 p-4 bg-navy-dark/40 hover:bg-navy-dark/60 rounded-xl border border-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-base">
                      {payment.stories?.title || "Unknown Story"}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-light/60 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-light/40" />
                        {new Date(payment.redeemed_at || payment.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-gray-light/40" />
                        <span className="truncate max-w-[120px]">{payment.purchaser_name || "Unknown"}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">
                      +{price.toLocaleString()} <span className="text-xs font-normal text-gray-light/50">MWK</span>
                    </p>
                    <div className="inline-block mt-1.5 px-2 py-0.5 bg-white/5 rounded border border-white/5">
                      <p className="text-[10px] sm:text-xs text-gray-light/50 font-mono tracking-wide truncate max-w-[80px] sm:max-w-[100px]">
                        {payment.code}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}