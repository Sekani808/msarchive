// src/app/admin/stories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Plus, Trash2, Lock, Unlock, Edit } from "lucide-react";
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
    <div className="space-y-6">
      <Toaster theme="dark" position="top-center" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Stories</h1>
          <p className="text-gray-light/60 mt-1">Manage your archive.</p>
        </div>
        <Link href="/admin/stories/new">
          <Button variant="primary">
            <Plus size={18} />
            Upload Story
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-light/50">Loading stories...</p>
      ) : stories.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <BookOpen className="mx-auto text-gray-light/30 mb-4" size={48} />
          <p className="text-gray-light/50">No stories yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="aspect-video w-full bg-navy-dark relative">
                {story.cover_image ? (
                  <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-light/30">
                    <BookOpen size={32} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {story.is_locked ? (
                    <span className="px-2 py-1 text-[10px] bg-accent-purple text-white rounded-full flex items-center gap-1">
                      <Lock size={10} /> {story.price_mwk} MWK
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-[10px] bg-brand text-navy-dark rounded-full font-bold">FREE</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-white text-lg line-clamp-1">{story.title}</h3>
                <p className="text-sm text-gray-light/60 line-clamp-2 mt-1 flex-1">{story.description}</p>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 gap-2">
                  <span className="text-xs text-gray-light/40">{story.category}</span>
                  <div className="flex gap-2">
                    <Link 
                      href={`/admin/stories/${story.id}`}
                      className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-full transition-colors"
                    >
                      <Edit size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(story.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
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