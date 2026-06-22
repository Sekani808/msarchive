// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Eye, DollarSign, KeyRound, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStories: 0,
    premiumStories: 0,
    totalViews: 0,
    totalCodes: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Stories
      const { data: stories } = await supabase.from("stories").select("id, is_locked, price_mwk");
      
      // 2. Fetch Views
      const { data: views } = await supabase.from("story_views").select("story_id, created_at");
      
      // 3. Fetch Codes
      const { data: codes } = await supabase.from("unlock_codes").select("id");

      // Calculate Stats
      const totalStories = stories?.length || 0;
      const premiumStories = stories?.filter(s => s.is_locked).length || 0;
      const totalViews = views?.length || 0;
      const totalCodes = codes?.length || 0;

      setStats({ totalStories, premiumStories, totalViews, totalCodes });

      // Prepare Chart Data (Views per story)
      if (stories && views) {
        const viewsPerStory = stories.map(story => {
          const count = views.filter(v => v.story_id === story.id).length;
          return {
            name: story.id.substring(0, 4), // Shortened ID for X-axis
            views: count
          };
        });
        setChartData(viewsPerStory);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    { title: "Total Stories", value: stats.totalStories, icon: BookOpen, color: "text-brand" },
    { title: "Premium Stories", value: stats.premiumStories, icon: KeyRound, color: "text-accent-purple" },
    { title: "Total Views", value: stats.totalViews, icon: Eye, color: "text-accent-blue" },
    { title: "Unlock Codes", value: stats.totalCodes, icon: TrendingUp, color: "text-brand-soft" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-light/50">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-light/60 mt-1">Welcome back. Here is your archive overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-light/60">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                <Icon size={24} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">Views per Story</h2>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
                <YAxis stroke="#ffffff50" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #ffffff20", borderRadius: "8px" }}
                  itemStyle={{ color: "#7BC943" }}
                />
                <Bar dataKey="views" fill="#7BC943" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-light/40">
              <p>No views yet. Start sharing your stories!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}