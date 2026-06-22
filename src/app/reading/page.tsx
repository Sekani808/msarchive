// src/app/reading/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReadingStore } from "@/store/useReadingStore";
import { supabase } from "@/lib/supabase";
import { BookOpen, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ReadingPage() {
  const router = useRouter();
  const { lastStoryId, lastChapterIndex } = useReadingStore();
  const [story, setStory] = useState<any>(null);

  useEffect(() => {
    if (!lastStoryId) return;
    
    const fetchStory = async () => {
      const { data } = await supabase.from("stories").select("*").eq("id", lastStoryId).single();
      if (data) setStory(data);
    };
    fetchStory();
  }, [lastStoryId]);

  const handleContinue = () => {
    router.push(`/read/${lastStoryId}`);
  };

  return (
    <main className="min-h-screen px-6 pt-12 pb-24">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 rounded-full glass hover:bg-white/10 transition-all active:scale-95"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">My Reading</h1>
      </div>

      {story ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center"
        >
          <div className="w-full md:w-32 aspect-[3/4] rounded-xl overflow-hidden bg-navy-dark flex-shrink-0">
            {story.cover_image ? (
              <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-light/30"><BookOpen /></div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold text-brand uppercase tracking-wider mb-2">Continue Reading</p>
            <h2 className="text-2xl font-bold text-white mb-2">{story.title}</h2>
            <p className="text-sm text-gray-light/60 mb-4">
              Picking up at Chapter {lastChapterIndex + 1}: {story.content[lastChapterIndex]?.title}
            </p>
            
            <button 
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-navy-dark rounded-full font-bold hover:scale-105 transition-transform active:scale-95"
            >
              <Play size={18} fill="currentColor" /> Resume Story
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="glass rounded-3xl p-12 text-center">
          <BookOpen className="mx-auto text-gray-light/30 mb-4" size={48} />
          <p className="text-gray-light/50">You haven't started any stories yet.</p>
          <button 
            onClick={() => router.push("/library")}
            className="mt-4 text-brand font-bold hover:underline"
          >
            Browse Library
          </button>
        </div>
      )}
    </main>
  );
}