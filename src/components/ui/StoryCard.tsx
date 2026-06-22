// src/components/ui/StoryCard.tsx
"use client";

import { motion } from "framer-motion";
import { Lock, BookOpen } from "lucide-react";
import { Story } from "@/types/story";
import Link from "next/link";
import { useUnlockStore } from "@/store/useUnlockStore";

interface StoryCardProps {
  story: Story;
  onUnlockClick: (story: Story) => void;
}

export default function StoryCard({ story, onUnlockClick }: StoryCardProps) {
  const isUnlocked = useUnlockStore((state) => state.isUnlocked(story.id));
  
  // Determine if we should show the lock icon
  const showLock = story.is_locked && !isUnlocked;

  // If it's locked and NOT owned, clicking it should open the modal, not navigate.
  const handleClick = (e: React.MouseEvent) => {
    if (showLock) {
      e.preventDefault(); // Stop the Link from navigating
      onUnlockClick(story); // Open the modal
    }
  };

  return (
    <Link href={`/read/${story.id}`} onClick={handleClick}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className={`relative group overflow-hidden rounded-2xl glass shadow-lg transition-all duration-500 ${
          showLock ? "grayscale-[0.5] opacity-80" : ""
        }`}
      >
        {/* Cover Image */}
        <div className="aspect-[3/4] w-full overflow-hidden">
          <img
            src={story.cover_image}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/40 to-transparent" />
        </div>

        {/* Badge (Free, Price, or Owned) */}
        <div className="absolute top-3 right-3">
          {isUnlocked ? (
            <span className="px-2 py-1 text-[10px] font-bold bg-brand text-navy-dark rounded-full flex items-center gap-1">
              Purchased ✓
            </span>
          ) : showLock ? (
            <span className="px-2 py-1 text-[10px] font-bold bg-accent-purple/90 text-white rounded-full flex items-center gap-1 backdrop-blur-sm">
              <Lock size={10} /> {story.price_mwk} MWK
            </span>
          ) : (
            <span className="px-2 py-1 text-[10px] font-bold bg-brand text-navy-dark rounded-full">
              FREE
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base font-bold text-white line-clamp-1 mb-1">
            {story.title}
          </h3>
          <p className="text-xs text-gray-light/70 line-clamp-2">
            {story.description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}