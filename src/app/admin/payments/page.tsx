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
  purchaser_name: string; // Changed from purchaser_phone
  devices_used: number;
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
    // Fetch all used codes EXCEPT those that have been revoked
    const { data, error } = await supabase
      .from("unlock_codes")
      .select("*, stories(title, price_mwk)")
      .gte("devices_used", 1)
      .eq("is_revoked", false) // ONLY count active, used codes
      .order("created_at", { ascending: false });

    if (data) {
      setPayments(data);
      
      // Calculate stats
      const totalRevenue = data.reduce((acc, payment) => {
        return acc + (payment.stories?.price_mwk || 0);
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
    return <div className="p-8 text-gray-light/50">Loading payments...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Payments</h1>
        <p className="text-gray-light/60 mt-1">Track revenue and transactions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Total Revenue</p>
            <DollarSign className="text-brand" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRevenue.toLocaleString()} MWK</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Total Transactions</p>
            <CreditCard className="text-accent-blue" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalTransactions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Avg. Transaction</p>
            <TrendingUp className="text-accent-purple" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgTransaction.toLocaleString()} MWK</p>
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
        
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto text-gray-light/30 mb-4" size={48} />
            <p className="text-gray-light/50">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-navy-dark/30 rounded-xl border border-white/5"
              >
                <div className="flex-1">
                  <p className="font-bold text-white">{payment.stories?.title || "Unknown Story"}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-light/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                    {/* Updated to show the purchaser's name with a User icon */}
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {payment.purchaser_name || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand">
                    +{(payment.stories?.price_mwk || 0).toLocaleString()} MWK
                  </p>
                  <p className="text-xs text-gray-light/50">Code: {payment.code}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}