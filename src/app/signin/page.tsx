"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSavedEmail, saveUserCredentials, saveEmail } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const heroVideos = [
    "/assets/videos/hero/hero-1.mp4",
    "/assets/videos/hero/hero-2.mp4",
    "/assets/videos/hero/hero-3.mp4",
    "/assets/videos/hero/hero-4.mp4",
    "/assets/videos/hero/hero-5.mp4",
  ];
  
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isAActive, setIsAActive] = useState(true);
  const transitionDurationMs = 1500;

  useEffect(() => {
    const active = isAActive ? videoARef.current : videoBRef.current;
    const bg = isAActive ? videoBRef.current : videoARef.current;

    if (active) {
      const src = heroVideos[currentVideoIndex];
      // FIX: Use endsWith to handle absolute vs relative URL mismatch
      if (!active.src || !active.src.endsWith(src)) {
        active.src = src;
        active.load();
      }
      active.muted = true;
      active.playsInline = true;
      active.play().catch(() => {});
    }

    const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
    if (bg) {
      const nextSrc = heroVideos[nextIndex];
      // FIX: Use endsWith to handle absolute vs relative URL mismatch
      if (!bg.src || !bg.src.endsWith(nextSrc)) {
        bg.src = nextSrc;
        bg.load();
      }
      bg.muted = true;
      bg.playsInline = true;
      try { bg.pause(); bg.currentTime = 0; } catch {}
    }

    const onEnded = () => {
      // FIX: Advance the index immediately so state stays in sync and avoids double-rendering
      setCurrentVideoIndex((i) => (i + 1) % heroVideos.length);

      if (bg) {
        try { bg.currentTime = 0; } catch {}
        bg.play().catch(() => {});
      }
      
      setIsAActive((v) => !v);
      
      setTimeout(() => {
        if (active) {
          try { active.pause(); active.currentTime = 0; } catch {}
        }
      }, transitionDurationMs + 50);
    };

    active?.addEventListener("ended", onEnded);
    return () => active?.removeEventListener("ended", onEnded);
  }, [currentVideoIndex, isAActive]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message || "Invalid email or password.");
      setIsLoading(false);
      return;
    }

    const user = data?.user;
    let username = "";

    if (user) {
      username = (user.user_metadata as any)?.username || "";
      if (!username) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (profileData?.username) {
          username = profileData.username;
        }
      }
      saveUserCredentials(username, email);
    } else {
      saveEmail(email);
    }

    toast.success("Welcome back!");
    router.push("/library");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-navy-dark relative">
      {/* Video background (same videos used on the home Hero) */}
      <video
        ref={videoARef}
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-100" : "opacity-0"}`}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={videoBRef}
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-0" : "opacity-100"}`}
        autoPlay
        muted
        playsInline
        preload="auto"
      />
      <div className="absolute inset-0 bg-navy-dark/70 z-10" />
      <Toaster theme="dark" position="top-center" />

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 relative z-20">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/50 mx-auto mb-4">
            <img src="/assets/images/logo/logo.png" alt="Msarchive Logo" className="w-[70%] h-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-light/60 mt-2">Sign in to continue your reading journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-base text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-base text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" 
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full mt-6 py-3.5 text-base font-semibold shadow-lg shadow-brand/20 active:scale-[0.98] transition-transform" 
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-light/60 mt-6">
          New here?{' '}
          <Link href="/signup" className="text-brand font-semibold hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}