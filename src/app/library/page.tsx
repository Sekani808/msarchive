// src/app/library/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import StoryCard from "@/components/ui/StoryCard";
import FilterChips from "@/components/ui/FilterChips";
import UnlockModal from "@/components/ui/UnlockModal";
import { supabase } from "@/lib/supabase";
import { Story } from "@/types/story";
import { Toaster } from "sonner";

export default function LibraryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [unlockingStory, setUnlockingStory] = useState<Story | null>(null);

  // Fetch real stories from Supabase
  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("published_date", { ascending: false });

      if (data) {
        setStories(data);
      }
      setIsLoading(false);
    };

    fetchStories();
  }, []);

  // Filter logic
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesFilter = true;
      if (activeFilter === "Free") matchesFilter = !story.is_locked;
      else if (activeFilter === "Premium") matchesFilter = story.is_locked;
      else if (activeFilter !== "All") matchesFilter = story.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [stories, searchQuery, activeFilter]);

  return (
    <main className="min-h-screen px-6 pt-12">
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <h1 className="text-3xl font-bold text-white mb-6">Library</h1>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light/50" size={18} />
        <input
          type="text"
          placeholder="Search stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-gray-light/50 focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-light/50">Loading your stories...</p>
        </div>
      ) : (
        <>
          {/* Story Grid */}
          <div className="grid grid-cols-2 gap-4 pb-10">
            {filteredStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                onUnlockClick={setUnlockingStory}
              />
            ))}
          </div>

          {filteredStories.length === 0 && (
            <p className="text-center text-gray-light/50 mt-10">No stories found.</p>
          )}
        </>
      )}

      {/* The Unlock Modal */}
      <UnlockModal 
        story={unlockingStory} 
        onClose={() => setUnlockingStory(null)} 
      />
    </main>
  );
}