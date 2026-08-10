// src/components/ui/FilterChips.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface FilterChipsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  const [categories, setCategories] = useState<string[]>(["All", "Free", "Premium"]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("category")
        .not("category", "is", null);

      if (data && data.length > 0) {
        const uniqueCategories = [...new Set(data.map(story => story.category).filter(Boolean))];
        const allCategories = [
          "All",
          "Free",
          "Premium",
          ...uniqueCategories.sort()
        ];
        setCategories(allCategories);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x snap-mandatory">
      {categories.map((cat) => {
        const isActive = activeFilter === cat;
        return (
          <motion.button
            key={cat}
            onClick={() => onFilterChange(cat)}
            whileTap={{ scale: 0.96 }}
            className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all select-none border ${
              isActive 
                ? "bg-brand text-navy-dark border-brand shadow-[0_0_12px_rgba(123,201,67,0.3)]" 
                : "bg-white/5 text-gray-light/80 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}