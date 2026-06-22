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
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(story => story.category).filter(Boolean))];
        
        // Combine with default filters, avoiding duplicates
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
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
      {categories.map((cat) => {
        const isActive = activeFilter === cat;
        return (
          <motion.button
            key={cat}
            onClick={() => onFilterChange(cat)}
            // The "Duolingo" mechanics: 3D border, press down effect
            whileTap={{ scale: 0.95, y: 2 }}
            className={`relative px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all select-none ${
              isActive 
                ? "bg-brand text-navy-dark border-b-4 border-b-[#5a9e2f] shadow-[0_4px_0_#5a9e2f]" 
                : "bg-navy text-gray-light/70 border-b-4 border-b-black shadow-[0_4px_0_#000000] hover:bg-white/5"
            }`}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}