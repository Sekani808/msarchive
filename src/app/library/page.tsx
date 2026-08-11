// src/app/library/page.tsx
// src/app/library/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import StoryCard from "@/components/ui/StoryCard";
import FilterChips from "@/components/ui/FilterChips";
import UnlockModal from "@/components/ui/UnlockModal";
import StoryDetailsSheet from "@/components/ui/StoryDetailsSheet";
import { supabase } from "@/lib/supabase";
import { Story } from "@/types/story";
import { Toaster, toast } from "sonner";

const greetingMessages = [
  "Every quiet page is a tiny rebellion. Let the story pick you.",
  "Turn seconds into chapters. Find the scene that makes you stay.",
  "Words are waiting. Today’s reading mood is fierce and curious.",
  "Lose track of time in something unexpected.",
  "Let your next bookmark be a small adventure.",
  "Stories are rooms you can enter without leaving your seat.",
  "A single page can be the start of a new favorite.",
  "This is your safe place for bold ideas and quiet thrills.",
  "Reading is the first step to building a private universe.",
  "The archive is full of stories that sound like home.",
  "Take a page, let it carry you further than the page.",
  "Every chapter is a gentle challenge. See what it asks of you.",
  "Ideas move faster than the world; reading slows you with purpose.",
  "Claim the next story like it belongs on your shelf.",
  "Your mood is ready; let a story meet it."
];

export default function LibraryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [unlockingStory, setUnlockingStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    const fetchStories = async () => {
      const { data: storiesData } = await supabase
        .from("stories")
        .select("*")
        .order("published_date", { ascending: false });

      const { data: ratingsData } = await supabase
        .from("story_ratings")
        .select("story_id, rating");

      const { data: allLikes } = await supabase.from("story_likes").select("story_id");
      
      const { data: { user } } = await supabase.auth.getUser();
      let userLikesSet = new Set<string>();
      if (user) {
        const { data: userLikes } = await supabase
          .from("story_likes")
          .select("story_id")
          .eq("user_id", user.id);
        userLikes?.forEach((l: { story_id: string }) => userLikesSet.add(l.story_id));
      }

      const ratingsMap = new Map<string, { total: number; count: number }>();
      ratingsData?.forEach((r: { story_id: string; rating: number }) => {
        if (!ratingsMap.has(r.story_id)) ratingsMap.set(r.story_id, { total: 0, count: 0 });
        const current = ratingsMap.get(r.story_id)!;
        current.total += r.rating;
        current.count += 1;
      });

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

    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setUserName(profile?.username || user.email?.split("@")[0] || null);
    };

    fetchStories();
    fetchUserName();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((current) => (current + 1) % greetingMessages.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLike = async (storyId: string, currentIsLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to like stories.");
      return;
    }

    const updateStoryState = (s: Story) => s.id === storyId ? {
      ...s,
      is_liked: !currentIsLiked,
      likes_count: Math.max(0, (s.likes_count || 0) + (currentIsLiked ? -1 : 1))
    } : s;

    setStories(prev => prev.map(updateStoryState));
    setSelectedStory(prev => prev ? updateStoryState(prev) : prev);

    let error;
    if (currentIsLiked) {
      ({ error } = await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", user.id));
    } else {
      ({ error } = await supabase.from("story_likes").insert({ story_id: storyId, user_id: user.id }));
    }

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
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 max-w-7xl mx-auto pb-20">
      <Toaster theme="dark" position="top-center" />

      <header className="mb-8 space-y-6">
        {/* Premium Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-6 md:p-8 shadow-2xl shadow-brand/5">
          {/* Background decorative glowing orbs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
          
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand/10">
                <UserCircle className="text-brand" size={28} />
              </div>
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-gray-light/60 font-medium mb-1">
                  {userName ? `Welcome back, ${userName}` : "Welcome to the archive"}
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white to-brand/80 bg-clip-text text-transparent tracking-tight">
                  Library
                </h1>
              </div>
            </div>
            
            <div className="md:text-right md:max-w-md">
              <p className="text-lg sm:text-xl font-medium text-gray-light/80 leading-relaxed italic font-serif">
                &ldquo;{userName ? greetingMessages[greetingIndex] : "Explore stories, save favorites, and sign in when you’re ready to purchase or continue reading."}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Premium Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light/40 group-focus-within:text-brand transition-colors pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search titles, authors, or descriptions..."
            aria-label="Search stories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-base text-white placeholder-gray-light/40 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 focus:bg-white/[0.05] transition-all shadow-lg shadow-black/10"
          />
        </div>
      </header>

      <div className="mb-8">
        <FilterChips activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                <Search className="text-gray-light/40" size={32} />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">No matches for &ldquo;{searchQuery}&rdquo;</h3>
                  <p className="text-sm text-gray-light/60 mb-6 max-w-xs">Try adjusting your search or exploring different categories.</p>
                  <button onClick={() => setSearchQuery("")} className="px-5 py-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20 text-sm font-semibold hover:bg-brand/20 transition-all active:scale-95">Clear search</button>
                </>
              ) : activeFilter !== "All" ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">No {activeFilter} stories found</h3>
                  <p className="text-sm text-gray-light/60 mb-6 max-w-xs">Try selecting a different category to discover more.</p>
                  <button onClick={() => setActiveFilter("All")} className="px-5 py-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20 text-sm font-semibold hover:bg-brand/20 transition-all active:scale-95">Clear filters</button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">The archive is empty</h3>
                  <p className="text-sm text-gray-light/60 max-w-xs">Check back soon for new stories and adventures.</p>
                </>
              )}
            </motion.div>
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