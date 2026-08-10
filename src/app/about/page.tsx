// src/app/about/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AboutPage() {
  const [stats, setStats] = useState({ totalStories: 0, totalChapters: 0 });

  // Fetch live stats from your Supabase database
  useEffect(() => {
    const fetchStats = async () => {
      const { data: stories } = await supabase.from("stories").select("id, content");
      if (stories) {
        const totalChapters = stories.reduce((acc, story) => {
          return acc + (Array.isArray(story.content) ? story.content.length : 0);
        }, 0);
        setStats({ totalStories: stories.length, totalChapters });
      }
    };
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen px-5 sm:px-8 pt-12 pb-32 max-w-3xl mx-auto space-y-16">
      
      {/* 1. Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 pt-4"
      >
        <div className="relative flex items-center justify-center mb-6">
          {/* Atmospheric green glow behind the circle */}
          <div className="absolute w-64 h-64 bg-brand/20 blur-[80px] rounded-full" />
          
          {/* Restored White Circle Container for Logo Contrast */}
          <div className="relative inline-flex items-center justify-center w-40 h-40 md:w-52 md:h-52 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/50">
            <img 
              src="/assets/images/logo/logo.png" 
              alt="Msarchive Logo" 
              className="w-[75%] h-auto object-contain"
            />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          The Archive
        </h1>
        <p className="text-gray-light/70 text-base max-w-md mx-auto leading-relaxed">
          A personal literary archive exploring the intersection of technology, data, and African storytelling.
        </p>
      </motion.section>

      {/* 2. The Author */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start"
      >
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-2 bg-brand/10 blur-2xl rounded-2xl opacity-60" />
          <img 
            src="/assets/images/author.jpg" 
            alt="Sekani Msachi" 
            className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover border border-white/10 shadow-xl"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Sekani Msachi</h2>
            <p className="text-brand text-sm font-medium mt-1 tracking-wide uppercase">Author, Creator & Developer</p>
          </div>
          
          <div className="space-y-3 text-sm md:text-base text-gray-light/80 leading-relaxed">
            <p>
              I am a Malawian student at the <strong className="text-white font-medium">Malawi University of Science and Technology (MUST)</strong>, pursuing a Bachelor's degree in Chemical Engineering. While my days are filled with equations, my soul belongs to words.
            </p>
            <p>
              I have a deep passion for poetry and African literature. I believe that the most profound lessons are learned through stories, and that is the heartbeat of everything written on this platform.
            </p>
            <p>
              But my curiosity doesn't stop at literature. I am equally passionate about data science and programming. Msarchive was born from the intersection of these two worlds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
            <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-gray-light/90 rounded-lg">
              Chemical Engineering
            </span>
            <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-gray-light/90 rounded-lg">
              African Literature
            </span>
            <span className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-gray-light/90 rounded-lg">
              Data Science & Code
            </span>
          </div>
        </div>
      </motion.section>

      {/* 3. Archive at a Glance */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-white">Archive at a Glance</h2>
          <p className="text-sm text-gray-light/60 mt-1">A growing sanctuary for words.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 border border-white/5 rounded-2xl bg-navy/40 text-center">
            <p className="text-4xl font-bold text-white tabular-nums">{stats.totalStories}</p>
            <p className="text-xs uppercase tracking-wider text-gray-light/60 mt-2 font-medium">Stories</p>
          </div>
          <div className="p-6 border border-white/5 rounded-2xl bg-navy/40 text-center">
            <p className="text-4xl font-bold text-white tabular-nums">{stats.totalChapters}</p>
            <p className="text-xs uppercase tracking-wider text-gray-light/60 mt-2 font-medium">Chapters</p>
          </div>
        </div>
      </motion.section>

      {/* 4. Mission / Philosophy */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative p-6 md:p-8 border-l-2 border-brand bg-white/[0.02] rounded-r-2xl">
          <h3 className="text-xs font-bold text-brand uppercase tracking-widest mb-4">The Mission</h3>
          <p className="text-lg md:text-xl text-gray-light/90 leading-relaxed font-light italic">
            "Msarchive was created to be a distraction-free sanctuary. In a world of fleeting content, I believe in the power of a good story. Every piece of content here is carefully crafted to provide a memorable, immersive reading experience that stays with you long after the last page."
          </p>
        </div>
      </motion.section>

      {/* 5. Reader Journey / CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 py-4"
      >
        <h2 className="text-xl font-bold text-white">Begin the Journey</h2>
        <p className="text-sm text-gray-light/70 max-w-sm mx-auto">
          Step into the archive and discover stories designed to stay with you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/library" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-navy-dark rounded-full font-semibold hover:opacity-90 transition-opacity active:scale-95"
          >
            <BookOpen size={18} />
            Explore the Library
          </Link>
          <Link 
            href="/reading" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full font-semibold hover:bg-white/10 transition-colors active:scale-95"
          >
            Start Reading
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.section>

      {/* 6. Contact */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-white">Get in Touch</h2>
          <p className="text-sm text-gray-light/60 mt-1">Have feedback or need help with an unlock? Reach out.</p>
        </div>

        <div className="space-y-2">
          <a 
            href="mailto:msachiseka@gmail.com" 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-brand/10 text-brand group-hover:bg-brand/20 transition-colors">
              <Mail size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-light/50 uppercase font-bold tracking-wider">Email</span>
              <span className="text-sm text-white font-medium">msachiseka@gmail.com</span>
            </div>
          </a>

          <a 
            href="tel:+265980720991" 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue group-hover:bg-accent-blue/20 transition-colors">
              <Phone size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-light/50 uppercase font-bold tracking-wider">Phone</span>
              <span className="text-sm text-white font-medium">+265 980 720 991</span>
            </div>
          </a>
        </div>
      </motion.section>

    </main>
  );
}