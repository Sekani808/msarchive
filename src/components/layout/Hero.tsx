// src/components/layout/Hero.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/Button";
import { BookOpen, Library } from "lucide-react";
import { useState, useEffect } from "react";

const heroVideos = [
  "/assets/videos/hero/hero-1.mp4",
  "/assets/videos/hero/hero-2.mp4",
  "/assets/videos/hero/hero-3.mp4",
  "/assets/videos/hero/hero-4.mp4",
  "/assets/videos/hero/hero-5.mp4",
];

const taglineWords = "Stories that stay with you long after the last page.".split(" ");

export default function Hero() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % heroVideos.length;
        setKey((k) => k + 1);
        return nextIndex;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % heroVideos.length;
      setKey((k) => k + 1);
      return nextIndex;
    });
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* Video Background */}
      <AnimatePresence mode="wait">
        <motion.video
          key={key}
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={handleVideoEnded}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={heroVideos[currentVideoIndex]}
        />
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-navy-dark/70 z-10" />

      {/* Floating Content - Shifted Upwards */}
      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full -translate-y-16 md:-translate-y-8">
        
        {/* 1. Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-[100px] rounded-full scale-[1.6]" />
            <img 
              src="/assets/images/logo/logo.png" 
              alt="Msarchive Logo"
              className="relative w-72 md:w-96 lg:w-[28rem] h-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            />
          </div>
        </motion.div>

        {/* 2. Tagline - Blur-Reveal Animation */}
        <div className="flex flex-wrap justify-center gap-x-2 mb-8 max-w-2xl px-2">
          {taglineWords.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ 
                duration: 0.6, 
                delay: 0.5 + index * 0.08, 
                ease: "easeOut" 
              }}
              className="text-base md:text-lg text-gray-light/90 font-light italic"
            >
              {word}
            </motion.span>
          ))}
        </div>

        {/* 3. Buttons - Spring Slide + Continuous Float */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          
          {/* Button 1 */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -5, 0] 
            }}
            transition={{ 
              x: { type: "spring", stiffness: 100, damping: 15, delay: 1.2 },
              opacity: { duration: 0.5, delay: 1.2 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.7 }
            }}
          >
            <Link href="/library">
              <Button variant="primary">
                <BookOpen size={18} />
                Start Reading
              </Button>
            </Link>
          </motion.div>
          
          {/* Button 2 */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -5, 0] 
            }}
            transition={{ 
              x: { type: "spring", stiffness: 100, damping: 15, delay: 1.3 },
              opacity: { duration: 0.5, delay: 1.3 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.8 }
            }}
          >
            <Link href="/library">
              <Button variant="secondary">
                <Library size={18} />
                Explore Library
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}