// src/components/layout/Hero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "../ui/Button";
import { BookOpen, Library } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

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
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [key, setKey] = useState(0);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const [isAActive, setIsAActive] = useState(true);
  const transitionDurationMs = 1500; // 1.5s crossfade

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    if (isReducedMotion) return;
    // Advance index — actual swap handled by crossfade logic
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % heroVideos.length);
    setKey((k) => k + 1);
  }, [isReducedMotion]);

  // Fallback timeout in case a video stalls or onEnded fails to fire
  useEffect(() => {
    if (isReducedMotion) return;
    const fallbackTimer = setTimeout(() => {
      handleVideoEnded();
    }, 15000); // 15 seconds fallback
    return () => clearTimeout(fallbackTimer);
  }, [currentVideoIndex, handleVideoEnded, isReducedMotion]);

  // Preload and manage two-video crossfade loop
  useEffect(() => {
    if (isReducedMotion) return;

    const activeRef = isAActive ? videoARef.current : videoBRef.current;
    const bgRef = isAActive ? videoBRef.current : videoARef.current;

    // Ensure active video has correct src and is playing
    if (activeRef) {
      const src = heroVideos[currentVideoIndex];
      if (activeRef.src !== src) {
        activeRef.src = src;
        activeRef.load();
      }
      // play if not already
      activeRef.muted = true;
      activeRef.playsInline = true;
      activeRef.play().catch(() => {});
    }

    // Prepare background video (next index) for a fast transition
    const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
    if (bgRef) {
      const nextSrc = heroVideos[nextIndex];
      if (bgRef.src !== nextSrc) {
        bgRef.src = nextSrc;
        bgRef.load();
      }
      bgRef.muted = true;
      bgRef.playsInline = true;
      // keep paused — we'll play it at transition time to ensure it starts at 0
      try { bgRef.pause(); bgRef.currentTime = 0; } catch {}
    }

    // When active video ends, crossfade to background (which should be preloaded)
    const onEnded = async () => {
      const incoming = bgRef;
      const outgoing = activeRef;

      if (!incoming) return;

      // Wait for incoming to have enough data (max wait 2s)
      const canPlayPromise = new Promise<void>((resolve) => {
        if (incoming.readyState >= 3) return resolve();
        const onCan = () => {
          incoming.removeEventListener("canplaythrough", onCan);
          resolve();
        };
        incoming.addEventListener("canplaythrough", onCan);
        // timeout fallback
        setTimeout(() => {
          incoming.removeEventListener("canplaythrough", onCan);
          resolve();
        }, 2000);
      });

      await canPlayPromise;

      // Advance the index so sources stay in sync
      setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);

      // Start incoming from 0 and play
      try { incoming.currentTime = 0; } catch {}
      incoming.play().catch(() => {});

      // flip active flag to trigger CSS crossfade
      setIsAActive((v) => !v);

      // after transition, pause outgoing and reset it for reuse
      setTimeout(() => {
        if (outgoing) {
          try { outgoing.pause(); outgoing.currentTime = 0; } catch {}
        }
      }, transitionDurationMs + 50);
    };

    if (activeRef) activeRef.addEventListener("ended", onEnded);

    return () => {
      if (activeRef) activeRef.removeEventListener("ended", onEnded);
    };
  }, [currentVideoIndex, isAActive, isReducedMotion]);

  return (
    // Used 100svh for better mobile viewport handling (accounts for browser address bars)
    <section className="relative h-[100svh] w-full flex items-center justify-center overflow-hidden">
      
      {/* Video Background */}
      {isReducedMotion ? (
        <video
          key={key}
          autoPlay
          loop
          muted
          playsInline
          onEnded={handleVideoEnded}
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={heroVideos[0]}
          preload="auto"
        />
      ) : (
        <>
          <video
            ref={videoARef}
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-100" : "opacity-0"}`}
            muted
            playsInline
            preload="auto"
          />

          <video
            ref={videoBRef}
            className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-0" : "opacity-100"}`}
            muted
            playsInline
            preload="auto"
          />
        </>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-navy-dark/70 z-10" />

      {/* Content - Shifted slightly to reduce vertical dead space */}
      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full -translate-y-8 md:-translate-y-4">
        
        {/* 1. Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/10 blur-[80px] rounded-full scale-[1.4]" />
            <img 
              src="/assets/images/logo/logo.png" 
              alt="Msarchive Logo"
              className="relative w-64 md:w-80 lg:w-96 h-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
            />
          </div>
        </motion.div>

        {/* 2. Tagline */}
        <div className="flex flex-wrap justify-center gap-x-2 mb-10 max-w-2xl px-2">
          {taglineWords.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
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

        {/* 3. Buttons - Removed infinite floating, improved mobile width */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 1.2 }}
            className="w-full sm:w-auto"
          >
            <Link href="/signup" className="block w-full">
              <div className="w-full sm:w-auto flex justify-center">
                <Button variant="primary">
                  <BookOpen size={18} />
                  Sign Up
                </Button>
              </div>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 1.3 }}
            className="w-full sm:w-auto"
          >
            <Link href="/library" className="block w-full">
              <div className="w-full sm:w-auto flex justify-center">
                <Button variant="secondary">
                  <Library size={18} />
                  Explore Library
                </Button>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}