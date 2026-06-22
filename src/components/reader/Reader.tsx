// src/components/reader/Reader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Sun, Moon, List, X, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReadingStore } from "@/store/useReadingStore";
import { supabase } from "@/lib/supabase";

interface Chapter {
  title: string;
  content: string[];
}

interface ReaderProps {
  storyId: string;
  title: string;
  chapters: Chapter[];
}

export default function Reader({ storyId, title, chapters }: ReaderProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { setLastRead, lastStoryId, lastChapterIndex } = useReadingStore();
  
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  // Automatically jump to the last read chapter when the reader loads
  useEffect(() => {
    if (lastStoryId === storyId && lastChapterIndex > 0 && lastChapterIndex < chapters.length) {
      setCurrentChapterIndex(lastChapterIndex);
    }
  }, [storyId, lastStoryId, lastChapterIndex, chapters.length]);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  const currentChapter = chapters[currentChapterIndex];

  // Track reading progress and save to store
  useEffect(() => {
    setLastRead(storyId, currentChapterIndex);
  }, [currentChapterIndex, storyId, setLastRead]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };
    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [currentChapterIndex]);

  // Track story view in database (Once per device per story)
  useEffect(() => {
    let deviceId = localStorage.getItem('msarchive_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('msarchive_device_id', deviceId);
    }

    // Get list of already viewed stories for this device
    const viewedStories = JSON.parse(localStorage.getItem('msarchive_viewed_stories') || '[]');

    // If this story hasn't been viewed yet, track it
    if (!viewedStories.includes(storyId)) {
      const trackView = async () => {
        await supabase.from('story_views').insert({
          story_id: storyId,
          device_id: deviceId
        });
        
        // Add to local storage so it doesn't count again
        viewedStories.push(storyId);
        localStorage.setItem('msarchive_viewed_stories', JSON.stringify(viewedStories));
      };
      
      trackView();
    }
  }, [storyId]);

  // Theme classes
  const bgClass = isDarkMode ? "bg-navy-dark" : "bg-gray-100";
  const textClass = isDarkMode ? "text-gray-light" : "text-navy-dark";
  const controlBg = isDarkMode ? "bg-navy/90" : "bg-white/90";
  const controlText = isDarkMode ? "text-gray-light" : "text-navy-dark";

  const goToNext = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      containerRef.current?.scrollTo(0, 0);
    }
  };

  const goToPrev = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      containerRef.current?.scrollTo(0, 0);
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col ${bgClass} transition-colors duration-300`}>
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-black/20">
        <motion.div className="h-full bg-brand" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Top Control Bar */}
      <AnimatePresence>
        {isControlsVisible && (
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`relative z-40 flex items-center justify-between px-4 py-3 ${controlBg} backdrop-blur-md border-b border-white/5`}
          >
            <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                <ArrowLeft size={20} />
              </button>
              <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                <List size={20} />
              </button>
            </div>
            
            <h2 className={`text-sm font-semibold truncate max-w-[40%] ${controlText}`}>
              {currentChapter?.title || title}
            </h2>
            
            <div className="flex items-center gap-1">
              <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                <Minus size={16} />
              </button>
              <span className={`text-xs font-bold w-6 text-center ${controlText}`}>{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                <Plus size={16} />
              </button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Reading Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        onClick={() => setIsControlsVisible(!isControlsVisible)}
      >
        <article className={`max-w-2xl mx-auto px-6 py-10 ${textClass}`} style={{ fontSize: `${fontSize}px`, lineHeight: "1.8" }}>
          <h1 className="text-2xl font-bold mb-8 text-center">{currentChapter?.title}</h1>
          
          {currentChapter?.content.map((paragraph, index) => (
            <p key={index} className="mb-6 text-justify last:mb-0">{paragraph}</p>
          ))}
          
          {/* Chapter Navigation Arrows */}
          <div className="mt-16 flex justify-between items-center border-t border-white/10 pt-8">
            <button 
              onClick={goToPrev}
              disabled={currentChapterIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full glass ${
                currentChapterIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10"
              } ${controlText}`}
            >
              <ChevronLeft size={18} /> Previous
            </button>

            <button 
              onClick={() => router.push("/library")}
              className="p-3 rounded-full glass hover:bg-white/10 text-brand"
            >
              <Home size={18} />
            </button>

            <button 
              onClick={goToNext}
              disabled={currentChapterIndex === chapters.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-full glass ${
                currentChapterIndex === chapters.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10"
              } ${controlText}`}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </article>
      </div>

      {/* Chapter Sidebar (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-sm ${bgClass} z-50 shadow-2xl flex flex-col border-r border-white/5`}
            >
              <div className={`p-4 border-b border-white/5 flex justify-between items-center ${controlBg}`}>
                <h3 className={`font-bold ${controlText}`}>Chapters</h3>
                <button onClick={() => setIsSidebarOpen(false)} className={`p-2 rounded-full hover:bg-white/10 ${controlText}`}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    onClick={() => { setCurrentChapterIndex(index); setIsSidebarOpen(false); containerRef.current?.scrollTo(0, 0); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      index === currentChapterIndex 
                        ? "bg-brand text-navy-dark" 
                        : `${controlText} hover:bg-white/5`
                    }`}
                  >
                    {chapter.title}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}