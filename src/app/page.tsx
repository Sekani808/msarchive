// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Hero from "@/components/layout/Hero";
import StoryCard from "@/components/ui/StoryCard";
import UnlockModal from "@/components/ui/UnlockModal";
import { supabase } from "@/lib/supabase";
import { Story } from "@/types/story";
import { Flame } from "lucide-react";

export default function Home() {
  const [trendingStories, setTrendingStories] = useState<Story[]>([]);
  const [unlockingStory, setUnlockingStory] = useState<Story | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .order("published_date", { ascending: false })
        .limit(3); // Changed from 4 to 3!
      
      if (data) setTrendingStories(data);
    };

    fetchTrending();
  }, []);

  return (
    <main className="min-h-screen bg-navy-dark">
      <Hero />
      
      {/* Trending / New Stories Section */}
      {trendingStories.length > 0 && (
        <section className="px-6 py-12 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <Flame className="text-brand" size={28} />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Fresh in the Archive</h2>
          </motion.div>

          {/* Updated grid to perfectly fit 3 items on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {trendingStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <StoryCard story={story} onUnlockClick={setUnlockingStory} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Unlock Modal */}
      <UnlockModal 
        story={unlockingStory} 
        onClose={() => setUnlockingStory(null)} 
      />
    </main>
  );
}
