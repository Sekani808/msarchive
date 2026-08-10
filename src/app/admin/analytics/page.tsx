"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { TrendingUp, BookOpen, ShoppingBag } from "lucide-react";

const COLORS = ["#7BC943", "#A78BFA", "#38BDF8", "#F472B6", "#FBBF24", "#34D399"];

interface LedgerEntry {
  id: string;
  source_type: "digital" | "physical";
  story_title: string;
  sale_date: string;
  amount_mwk: number;
  quantity: number;
}

interface MonthlyData {
  month: string;
  digitalRevenue: number;
  physicalRevenue: number;
  totalRevenue: number;
}

interface StoryRevenue {
  name: string;
  value: number;
}

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [storyRevenueData, setStoryRevenueData] = useState<StoryRevenue[]>([]);
  const [totals, setTotals] = useState({ digital: 0, physical: 0, total: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    // Fetch ALL sales from the unified ledger
    const { data: sales } = await supabase
      .from("v_sales_ledger")
      .select("*")
      .order("sale_date", { ascending: true });

    if (!sales) {
      setIsLoading(false);
      return;
    }

    const monthlyMap = new Map<string, { digital: number; physical: number }>();
    const storyMap = new Map<string, number>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const getMonthKey = (dateStr: string) => {
      const date = new Date(dateStr);
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    };

    let totalDigital = 0;
    let totalPhysical = 0;

    (sales as LedgerEntry[]).forEach((sale) => {
      const price = sale.amount_mwk || 0;
      const monthKey = getMonthKey(sale.sale_date);
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { digital: 0, physical: 0 });
      }
      
      if (sale.source_type === "digital") {
        monthlyMap.get(monthKey)!.digital += price;
        totalDigital += price;
      } else {
        monthlyMap.get(monthKey)!.physical += price;
        totalPhysical += price;
      }

      const storyTitle = sale.story_title || "Unknown";
      storyMap.set(storyTitle, (storyMap.get(storyTitle) || 0) + price);
    });

    const formattedMonthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      digitalRevenue: data.digital,
      physicalRevenue: data.physical,
      totalRevenue: data.digital + data.physical
    }));

    const formattedStories = Array.from(storyMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setMonthlyData(formattedMonthly);
    setStoryRevenueData(formattedStories);
    setTotals({ 
      digital: totalDigital, 
      physical: totalPhysical, 
      total: totalDigital + totalPhysical 
    });
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="p-8 text-gray-light/50">Calculating analytics...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-light/60 mt-1">Track your revenue and sales performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Digital Revenue</p>
            <BookOpen className="text-accent-purple" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{totals.digital.toLocaleString()} MWK</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Physical Revenue</p>
            <ShoppingBag className="text-brand" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{totals.physical.toLocaleString()} MWK</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Total Revenue</p>
            <TrendingUp className="text-accent-blue" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{totals.total.toLocaleString()} MWK</p>
        </motion.div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Monthly Revenue Trend</h2>
        <div className="h-80 w-full">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#ffffff50" fontSize={12} />
                <YAxis stroke="#ffffff50" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #ffffff20", borderRadius: "8px" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Legend />
                <Line type="monotone" dataKey="digitalRevenue" name="Digital Sales" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="physicalRevenue" name="Physical Sales" stroke="#7BC943" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-light/40">
              <p>No sales data available yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Top Revenue by Story</h2>
        <div className="h-80 w-full">
          {storyRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storyRevenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {storyRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #ffffff20", borderRadius: "8px" }}
                  itemStyle={{ color: "#ffffff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-light/40">
              <p>No story revenue data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}