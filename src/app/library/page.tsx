// src/app/library/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import StoryCard from "@/components/ui/StoryCard";
import FilterChips from "@/components/ui/FilterChips";
import UnlockModal from "@/components/ui/UnlockModal";
import StoryDetailsSheet from "@/components/ui/StoryDetailsSheet";
import { supabase } from "@/lib/supabase";
import { Story } from "@/types/story";
import { Toaster, toast } from "sonner";

export default function LibraryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [unlockingStory, setUnlockingStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      const { data: storiesData } = await supabase
        .from("stories")
        .select("*")
        .order("published_date", { ascending: false });

      const { data: ratingsData } = await supabase
        .from("story_ratings")
        .select("story_id, rating");

      // Fetch all likes for aggregate counts
      const { data: allLikes } = await supabase.from("story_likes").select("story_id");
      
      // Fetch current user's likes
      const { data: { user } } = await supabase.auth.getUser();
      let userLikesSet = new Set<string>();
      if (user) {
        const { data: userLikes } = await supabase
          .from("story_likes")
          .select("story_id")
          .eq("user_id", user.id);
        userLikes?.forEach((l: { story_id: string }) => userLikesSet.add(l.story_id));
      }

      // Aggregate Ratings
      const ratingsMap = new Map<string, { total: number; count: number }>();
      ratingsData?.forEach((r: { story_id: string; rating: number }) => {
        if (!ratingsMap.has(r.story_id)) ratingsMap.set(r.story_id, { total: 0, count: 0 });
        const current = ratingsMap.get(r.story_id)!;
        current.total += r.rating;
        current.count += 1;
      });

      // Aggregate Likes
      const likesMap = new Map<string, number>();
      allLikes?.forEach((l: { story_id: string }) => {
        likesMap.set(l.story_id, (likesMap.get(l.story_id) || 0) + 1);
      });

      const finalStories = storiesData?.map(story => {
        const rStats = ratingsMap.get(story.id);
        return {
          ...story,
          average_rating: rStats ? rStats.total / rStats.count : null,
          ratings_count: rStats ? rStats.count : 0,
          likes_count: likesMap.get(story.id) || 0,
          is_liked: userLikesSet.has(story.id)
        };
      }) || [];

      if (finalStories.length > 0) setStories(finalStories as Story[]);
      setIsLoading(false);
    };

    fetchStories();
  }, []);

  const handleToggleLike = async (storyId: string, currentIsLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to like stories.");
      return;
    }

    // Optimistic UI Update Helper
    const updateStoryState = (s: Story) => s.id === storyId ? {
      ...s,
      is_liked: !currentIsLiked,
      likes_count: Math.max(0, (s.likes_count || 0) + (currentIsLiked ? -1 : 1))
    } : s;

    setStories(prev => prev.map(updateStoryState));
    setSelectedStory(prev => prev ? updateStoryState(prev) : prev);

    // Database Operation
    let error;
    if (currentIsLiked) {
      ({ error } = await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("story_likes").insert({ story_id: storyId, user_id: user.id }));
    }

    // Rollback on failure
    if (error) {
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, is_liked: currentIsLiked, likes_count: (s.likes_count || 0) + (currentIsLiked ? 1 : -1) } : s));
      setSelectedStory(prev => prev && prev.id === storyId ? { ...prev, is_liked: currentIsLiked, likes_count: (prev.likes_count || 0) + (currentIsLiked ? 1 : -1) } : prev);
      toast.error("Failed to update like status.");
    }
  };

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        story.title.toLowerCase().includes(query) ||
        (story.description && story.description.toLowerCase().includes(query));
        
      let matchesFilter = true;
      if (activeFilter === "Free") matchesFilter = !story.is_locked;
      else if (activeFilter === "Premium") matchesFilter = story.is_locked;
      else if (activeFilter !== "All") matchesFilter = story.category === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [stories, searchQuery, activeFilter]);

  return (
    <main className="min-h-screen px-6 pt-8 md:pt-12">
      <Toaster theme="dark" position="top-center" />

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Library</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light/50 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search titles or descriptions..."
            aria-label="Search stories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-gray-light/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 transition-all"
          />
        </div>
      </header>

      <div className="mb-6">
        <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-navy/50 animate-pulse">
              <div className="aspect-[3/4] w-full bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredStories.map((story) => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  onSelectStory={setSelectedStory}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Search className="text-gray-light/40" size={24} />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">No matches for &quot;{searchQuery}&quot;</h3>
                  <p className="text-sm text-gray-light/60 mb-4">Try adjusting your search or filters.</p>
                  <button onClick={() => setSearchQuery("")} className="text-sm font-medium text-brand hover:underline">Clear search</button>
                </>
              ) : activeFilter !== "All" ? (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">No {activeFilter} stories found</h3>
                  <p className="text-sm text-gray-light/60 mb-4">Try selecting a different category.</p>
                  <button onClick={() => setActiveFilter("All")} className="text-sm font-medium text-brand hover:underline">Clear filters</button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-white mb-1">The archive is empty</h3>
                  <p className="text-sm text-gray-light/60">Check back soon for new stories.</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      <StoryDetailsSheet 
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onUnlockClick={setUnlockingStory}
        onToggleLike={handleToggleLike}
      />

      <UnlockModal 
        story={unlockingStory} 
        onClose={() => setUnlockingStory(null)} 
      />
    </main>
  );
}