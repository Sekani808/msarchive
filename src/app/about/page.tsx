// src/app/about/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Pen, Globe, Code, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    <main className="min-h-screen px-6 pt-12 pb-24 max-w-4xl mx-auto space-y-12">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        {/* Logo sitting on a White Circle */}
        <div className="inline-flex items-center justify-center w-48 h-48 md:w-64 md:h-64 bg-white rounded-full shadow-2xl mb-6">
          <img 
            src="/assets/images/logo/logo.png" 
            alt="Msarchive Logo" 
            className="w-[80%] h-auto object-contain"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          The <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-brand-soft">Archive</span>
        </h1>
      </motion.div>

      {/* Section 1: The Author */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center"
      >
        {/* Author Photo */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-brand/20 blur-3xl rounded-full scale-150" />
          <img 
            src="/assets/images/author.jpg" 
            alt="Sekani Msachi" 
            className="relative w-48 h-48 md:w-56 md:h-56 rounded-3xl object-cover border-2 border-brand/30 shadow-2xl"
          />
        </div>

        {/* Author Bio */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
              <Pen className="text-brand" size={24} /> Sekani Msachi
            </h2>
            <p className="text-brand font-medium mt-1">Author, Creator & Developer</p>
          </div>
          
          <p className="text-gray-light/80 leading-relaxed">
            I am a 19-year-old Malawian student at the <strong className="text-white">Malawi University of Science and Technology (MUST)</strong>, pursuing a Bachelor's degree in Chemical Engineering. While my days are filled with equations, my soul belongs to words.
          </p>
          <p className="text-gray-light/80 leading-relaxed">
            I have a deep passion for poetry and African literature. I believe that the most profound lessons are learned through stories, and that is the heartbeat of everything written on this platform. But my curiosity doesn't stop at literature, I am equally passionate about data science and programming. Msarchive was born from the intersection of these two worlds.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
            <span className="px-3 py-1 text-xs font-bold bg-accent-blue/20 text-accent-blue rounded-full flex items-center gap-1.5">
              <GraduationCap size={12} /> Chemical Engineering
            </span>
            <span className="px-3 py-1 text-xs font-bold bg-accent-purple/20 text-accent-purple rounded-full flex items-center gap-1.5">
              <Globe size={12} /> African Literature
            </span>
            <span className="px-3 py-1 text-xs font-bold bg-brand/20 text-brand rounded-full flex items-center gap-1.5">
              <Code size={12} /> Data Science & Code
            </span>
          </div>
        </div>
      </motion.section>

      {/* Section 2: The Archive Stats & Mission */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 justify-center">
            <BookOpen className="text-accent-blue" size={28} /> The Archive
          </h2>
          <p className="text-gray-light/60 mt-2">A growing sanctuary for words.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-brand">{stats.totalStories}</p>
            <p className="text-sm text-gray-light/60 mt-1">Stories Published</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-4xl font-bold text-accent-purple">{stats.totalChapters}</p>
            <p className="text-sm text-gray-light/60 mt-1">Chapters Written</p>
          </div>
        </div>

        {/* Mission */}
        <div className="glass rounded-3xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="text-brand" size={20} /> My Mission
          </h3>
          <p className="text-gray-light/80 leading-relaxed">
            Msarchive was created to be a distraction-free sanctuary. In a world of fleeting content, I believe in the power of a good story. Every piece of content here is carefully crafted to provide a memorable, immersive reading experience that stays with you long after the last page.
          </p>
        </div>
      </motion.section>

      {/* Section 3: Contact */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Get in Touch</h2>
          <p className="text-gray-light/60 mt-2">Have feedback or need help with an unlock? Reach out.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="mailto:msachiseka@gmail.com" className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group">
            <div className="p-3 rounded-xl bg-brand/20 text-brand group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-light/50 uppercase font-bold tracking-wider">Email</p>
              <p className="text-white font-medium">msachiseka@gmail.com</p>
            </div>
          </a>

          <a href="tel:+265980720991" className="glass rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group">
            <div className="p-3 rounded-xl bg-accent-blue/20 text-accent-blue group-hover:scale-110 transition-transform">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-light/50 uppercase font-bold tracking-wider">Phone</p>
              <p className="text-white font-medium">+265 980 720 991</p>
            </div>
          </a>
        </div>
      </motion.section>

    </main>
  );
}