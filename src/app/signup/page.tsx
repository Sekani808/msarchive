"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { saveUserCredentials } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength logic
  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthText = strength === 0 ? 'Enter a password' : strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong';
  const strengthColor = strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-orange-500' : strength === 3 ? 'bg-yellow-500' : 'bg-emerald-500';
  const strengthTextColor = strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-orange-400' : strength === 3 ? 'text-yellow-400' : 'text-emerald-400';

  const upsertProfile = async (userId: string, name: string) => {
    await supabase.from("profiles").upsert(
      { id: userId, username: name, email },
      { onConflict: "id" }
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      return toast.error("Please fill in all fields.");
    }
    if (strength < 3) {
      return toast.error("Please choose a stronger password (Good or Strong).");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } },
    });

    if (error) {
      toast.error(error.message || "Unable to create account.");
      setIsLoading(false);
      return;
    }

    let user = data?.user;

    if (!user) {
      const loginResult = await supabase.auth.signInWithPassword({ email, password });
      if (loginResult.error) {
        toast.success("Account created. Please check your email to confirm access.");
        saveUserCredentials(username.trim(), email);
        router.push("/login");
        return;
      }
      user = loginResult.data.user;
    }

    if (user) {
      await upsertProfile(user.id, username.trim());
      saveUserCredentials(username.trim(), email);
      toast.success("Account created successfully!");
      router.push("/library");
    }

    setIsLoading(false);
  };

  const heroVideos = [
    "/assets/videos/hero/hero-1.mp4",
    "/assets/videos/hero/hero-2.mp4",
    "/assets/videos/hero/hero-3.mp4",
    "/assets/videos/hero/hero-4.mp4",
    "/assets/videos/hero/hero-5.mp4",
  ];
  const [videoKey] = useState(0);
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
      if (active.src !== src) {
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
      if (bg.src !== nextSrc) {
        bg.src = nextSrc;
        bg.load();
      }
      bg.muted = true;
      bg.playsInline = true;
      try { bg.pause(); bg.currentTime = 0; } catch {}
    }

    const onEnded = () => {
      // start incoming
      if (bg) {
        try { bg.currentTime = 0; } catch {}
        bg.play().catch(() => {});
      }
      setIsAActive((v) => !v);
      setTimeout(() => {
        if (active) {
          try { active.pause(); active.currentTime = 0; } catch {}
        }
        setCurrentVideoIndex((i) => (i + 1) % heroVideos.length);
      }, transitionDurationMs + 50);
    };

    active?.addEventListener("ended", onEnded);
    return () => active?.removeEventListener("ended", onEnded);
  }, [currentVideoIndex, isAActive]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-navy-dark relative">
      {/* Dual preloaded videos for smooth crossfade */}
      <video
        ref={videoARef}
        src={heroVideos[0]}
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
        preload="auto"
      />
      <video
        ref={videoBRef}
        src={heroVideos[1]}
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-[1500ms] ease-in-out ${isAActive ? "opacity-0" : "opacity-100"}`}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Msarchive</h1>
          <p className="text-sm text-gray-light/60 mt-2">Create your account and start your reading journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-base text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

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
          <div>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors" tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Strength Meter */}
            {password && (
              <div className="mt-2.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1.5 font-medium ${strengthTextColor}`}>
                  {strengthText} • <span className="text-gray-500 font-normal">8+ chars, uppercase, number, symbol</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-base text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {confirmPassword && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                  {password === confirmPassword ? <Check size={18} /> : <X size={18} />}
                </div>
              )}
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs mt-1.5 text-red-400 font-medium">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" variant="primary" className="w-full mt-6 py-3.5 text-base font-semibold shadow-lg shadow-brand/20 active:scale-[0.98] transition-transform" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-light/60 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </main>
  );
}