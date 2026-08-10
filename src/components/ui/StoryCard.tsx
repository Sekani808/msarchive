// src/components/ui/StoryCard.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, Star, Heart } from "lucide-react";
import { Story } from "@/types/story";
import { useUnlockStore } from "@/store/useUnlockStore";

interface StoryCardProps {
  story: Story;
  onSelectStory?: (story: Story) => void;
  onUnlockClick?: (story: Story) => void;
  onToggleLike?: (storyId: string, isLiked: boolean) => void;
}

const formatCount = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

export default function StoryCard({ story, onSelectStory, onUnlockClick, onToggleLike }: StoryCardProps) {
  const isUnlocked = useUnlockStore((state) => state.isUnlocked(story.id));
  const showLock = story.is_locked && !isUnlocked;
  const avgRating = story.average_rating;

  const handleClick = () => {
    if (onUnlockClick && showLock) {
      onUnlockClick(story);
      return;
    }

    onSelectStory?.(story);
  };

  return (
    <div onClick={handleClick} className="block group h-full cursor-pointer">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`relative flex flex-col h-full overflow-hidden rounded-2xl border border-white/5 bg-navy shadow-lg transition-all duration-300 ${
          showLock ? "opacity-90" : ""
        }`}
      >
        {/* COVER AREA */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-navy-dark">
          <img
            src={story.cover_image}
            alt={`Cover of ${story.title}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 shadow-inner pointer-events-none" />
          <div className="absolute top-2 right-2 z-20">
            {isUnlocked ? (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand text-navy-dark rounded-md flex items-center gap-1 shadow-md">Owned</span>
            ) : showLock ? (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-accent-purple/90 text-white rounded-md flex items-center gap-1 backdrop-blur-sm border border-white/10">
                <Lock size={10} /> {story.price_mwk}
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-brand text-navy-dark rounded-md shadow-md">FREE</span>
            )}
          </div>
          {showLock && (
             <div className="absolute inset-0 bg-navy-dark/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 p-2 rounded-full border border-white/10">
                   <Lock size={16} className="text-white/80" />
                </div>
             </div>
          )}
        </div>

        {/* INFORMATION AREA */}
        <div className="flex flex-col flex-1 p-3 bg-navy">
          <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1" title={story.title}>
            {story.title}
          </h3>
          
          <div className="flex items-center gap-3 mb-1.5 text-[10px] text-gray-light/60">
            <div className="flex items-center gap-0.5">
              {avgRating ? (
                <>
                  <Star size={10} className="text-yellow-500 fill-yellow-500" />
                  <span>{avgRating.toFixed(1)}</span>
                </>
              ) : (
                <span className="text-gray-light/40 italic">New</span>
              )}
            </div>
            
            {/* Interactive Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike?.(story.id, !!story.is_liked);
              }}
              className="flex items-center gap-0.5 hover:scale-110 transition-transform active:scale-95"
            >
              <Heart 
                size={10} 
                className={`transition-colors ${
                  story.is_liked ? "text-red-500 fill-red-500" : "text-gray-light/60"
                }`} 
              />
              <span>{formatCount(story.likes_count || 0)}</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-light/60 line-clamp-2 leading-snug">
            {story.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}