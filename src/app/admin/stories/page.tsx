// src/app/admin/stories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Plus, Trash2, Lock, Edit } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("published_date", { ascending: false });

    if (data) setStories(data);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story and its cover image?")) return;
    
    // 1. Fetch the story to get the cover image URL
    const { data: story } = await supabase
      .from("stories")
      .select("cover_image")
      .eq("id", id)
      .single();
    
    // 2. If a cover image exists, delete it from Supabase Storage
    if (story && story.cover_image) {
      // Extract the file name from the end of the URL
      const fileName = story.cover_image.split('/').pop(); 
      
      if (fileName) {
        await supabase.storage.from('covers').remove([fileName]);
      }
    }
    
    // 3. Delete the story from the database (this also cascades to views, codes, etc.)
    await supabase.from("stories").delete().eq("id", id);
    
    // 4. Refresh the list
    fetchStories();
    toast.success("Story and cover image deleted successfully.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Stories</h1>
          <p className="text-gray-light/60 mt-1 text-sm sm:text-base">Manage your archive.</p>
        </div>
        <Link href="/admin/stories/new" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-transform py-2.5 px-4">
            <Plus size={18} />
            <span className="hidden sm:inline">Upload Story</span>
            <span className="sm:hidden">New Story</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-light/50 animate-pulse">Loading stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="text-gray-light/40" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No stories yet</h3>
          <p className="text-gray-light/50 text-sm">Upload your first story to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl overflow-hidden flex flex-col border border-white/5 hover:border-white/10 transition-colors group shadow-lg"
            >
              <div className="aspect-[16/10] sm:aspect-video w-full bg-navy-dark relative overflow-hidden">
                {story.cover_image ? (
                  <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-light/30 bg-gradient-to-br from-navy-dark to-navy">
                    <BookOpen size={40} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  {story.is_locked ? (
                    <span className="px-2.5 py-1 text-xs bg-accent-purple/90 backdrop-blur-md text-white rounded-full flex items-center gap-1.5 shadow-lg font-medium">
                      <Lock size={12} /> {story.price_mwk} MWK
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs bg-emerald-500/90 backdrop-blur-md text-white rounded-full font-bold shadow-lg tracking-wide">FREE</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-white text-lg sm:text-xl line-clamp-1">{story.title}</h3>
                <p className="text-sm text-gray-light/60 line-clamp-2 mt-2 flex-1 leading-relaxed">{story.description}</p>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-light/60 bg-white/5 px-2.5 py-1 rounded-md font-medium">{story.category}</span>
                  <div className="flex gap-1">
                    <Link 
                      href={`/admin/stories/${story.id}`}
                      className="p-2.5 text-accent-blue hover:bg-accent-blue/10 active:bg-accent-blue/20 rounded-full transition-colors"
                      aria-label="Edit story"
                    >
                      <Edit size={18} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(story.id)}
                      className="p-2.5 text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-full transition-colors"
                      aria-label="Delete story"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}