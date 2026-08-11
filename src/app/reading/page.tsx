// src/app/reading/page.tsx
// src/app/reading/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import {
  Heart,
  MessageSquare,
  Star,
  Sparkles,
  BookOpen,
  Clock3,
  LayoutList,
  ArrowLeft,
  UserCircle,
  TrendingUp,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useReadingStore } from "@/store/useReadingStore";

const greetingMessages = [
  "Every quiet page is a tiny rebellion. Let the story pick you.",
  "Turn seconds into chapters. Find the scene that makes you stay.",
  "Words are waiting. Today’s reading mood is fierce and curious.",
  "Lose track of time in something unexpected.",
  "Let your next bookmark be a small adventure.",
  "Stories are rooms you can enter without leaving your seat.",
  "A single page can be the start of a new favorite.",
  "This is your safe place for bold ideas and quiet thrills.",
  "Reading is the first step to building a private universe.",
  "The archive is full of stories that sound like home.",
  "Take a page, let it carry you further than the page.",
  "Every chapter is a gentle challenge. See what it asks of you.",
  "Ideas move faster than the world; reading slows you with purpose.",
  "Claim the next story like it belongs on your shelf.",
  "Your mood is ready; let a story meet it."
];

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function ReadingPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    completedStories: 0,
    ratingsGiven: 0,
    commentsMade: 0,
    likesGiven: 0,
    wordsRead: 0,
    chaptersRead: 0,
    storiesRead: 0,
    estimatedMinutes: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

  const { lastStoryId, lastChapterIndex } = useReadingStore();
  const [resumeInfo, setResumeInfo] = useState<{
    storyId: string;
    storyTitle: string;
    chapterLabel: string;
    coverImage: string | null;
  } | null>(null);
  const [isFetchingResume, setIsFetchingResume] = useState(false);
  const [perStoryStats, setPerStoryStats] = useState<Array<{
    id: string;
    title: string;
    words: number;
    chapters: number;
    completed_at: string | null;
    cover_image?: string | null;
  }>>([]);

  useEffect(() => {
    let channel: any = null;
    // FIX: hoisted to effect scope so the cleanup function below can actually see it.
    // Previously this was declared with `const` inside `init()`, which meant the
    // `clearInterval` call in the returned cleanup function referenced a variable
    // that didn't exist in that scope. The try/catch silently swallowed the
    // ReferenceError, so the interval was NEVER cleared on unmount/re-run.
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    // FIX: guards against React Strict Mode's mount -> unmount -> remount cycle.
    // If this effect instance's cleanup has already run by the time the async
    // init() work resolves, we must not touch the channel/state anymore.
    let cancelled = false;

    const loadStatsData = async (userId: string) => {
      const [completionRes, ratingRes, commentRes, likeRes] = await Promise.all([
        supabase.from("story_completions").select("story_id, created_at").eq("user_id", userId),
        supabase.from("story_ratings").select("story_id").eq("user_id", userId),
        supabase.from("story_comments").select("story_id").eq("user_id", userId),
        supabase.from("story_likes").select("story_id").eq("user_id", userId),
      ]);

      const completed = completionRes.data || [];
      const completedStoryIds = Array.from(new Set(completed.map((item: any) => item.story_id)));

      let perStats: Array<any> = [];
      if (completedStoryIds.length > 0) {
        const { data: storiesData } = await supabase
          .from("stories")
          .select("id, title, content, cover_image")
          .in("id", completedStoryIds as string[]);

        perStats = (storiesData || []).map((story: any) => {
          let words = 0;
          let chapters = 0;
          if (Array.isArray(story.content)) {
            story.content.forEach((chapter: any) => {
              const text = typeof chapter.content === "string" ? chapter.content : Array.isArray(chapter.content) ? chapter.content.join(" ") : "";
              words += text.split(/\s+/).filter(Boolean).length;
              chapters += 1;
            });
          }

          const comp = completed.find((c: any) => c.story_id === story.id);
          return {
            id: story.id,
            title: story.title,
            words,
            chapters,
            completed_at: comp?.created_at ?? null,
            cover_image: story.cover_image ?? null
          };
        });
      }

      const activity = new Array(6).fill(0);
      const now = new Date();
      completed.forEach((item: any) => {
        if (item.created_at) {
          const date = new Date(item.created_at);
          const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
          if (diffMonths >= 0 && diffMonths < 6) {
            activity[5 - diffMonths]++;
          }
        }
      });

      const wordsRead = perStats.reduce((s, p) => s + (p.words || 0), 0);
      const chaptersRead = perStats.reduce((s, p) => s + (p.chapters || 0), 0);
      const estimatedMinutes = Math.max(1, Math.round(wordsRead / 200));

      setPerStoryStats(perStats.sort((a, b) => (new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())));
      setMonthlyActivity(activity);
      setStats({
        completedStories: perStats.length,
        ratingsGiven: ratingRes.data?.length ?? 0,
        commentsMade: commentRes.data?.length ?? 0,
        likesGiven: likeRes.data?.length ?? 0,
        wordsRead,
        chaptersRead,
        storiesRead: perStats.length,
        estimatedMinutes,
      });
      setIsLoading(false);
    };

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (cancelled) return;
      setUsername(profileData?.username || user.email?.split("@")[0] || "Reader");

      if (!cancelled) {
        setShowMaintenanceAlert(true);
      }

      await loadStatsData(user.id);

      const channelName = `dashboard-realtime-${user.id}-${Math.random().toString(36).slice(2)}`;
      channel = supabase.channel(channelName);
      const realtimeTables = [
        'story_completions',
        'story_ratings',
        'story_comments',
        'story_likes',
      ];

      realtimeTables.forEach((tbl) => {
        ['INSERT', 'UPDATE', 'DELETE'].forEach((evt) => {
          channel.on('postgres_changes', { event: evt, schema: 'public', table: tbl, filter: `user_id=eq.${user.id}` }, (payload: any) => {
            // eslint-disable-next-line no-console
            console.debug('[realtime] event', evt, 'table', tbl, 'payload', payload);
            loadStatsData(user.id).catch((e) => console.error('reload stats failed', e));
          });
        });
      });

      // Fallback polling in case realtime messages are missed or not available.
      pollInterval = setInterval(() => {
        loadStatsData(user.id).catch((e) => console.error('poll reload stats failed', e));
      }, 30000);

      channel.subscribe();
    };

    init();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Unable to sign out");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIndex((value) => (value + 1) % greetingMessages.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showMaintenanceAlert) return;

    const timer = setTimeout(() => {
      setShowMaintenanceAlert(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [showMaintenanceAlert]);

  useEffect(() => {
    // Only fetch resume info for signed-in users
    if (!username) {
      setResumeInfo(null);
      return;
    }

    if (!lastStoryId || lastChapterIndex < 0) {
      setResumeInfo(null);
      return;
    }

    let active = true;
    setIsFetchingResume(true);

    const fetchResumeStory = async () => {
      try {
        const { data: storyData, error } = await supabase
          .from("stories")
          .select("title, content, cover_image")
          .eq("id", lastStoryId)
          .single();

        if (error || !storyData || !active) {
          setResumeInfo(null);
          return;
        }

        const chapters = Array.isArray(storyData.content) ? storyData.content : [];
        if (lastChapterIndex >= chapters.length) {
          setResumeInfo(null);
          return;
        }

        const chapter = chapters[lastChapterIndex] ?? null;
        const chapterLabel = chapter?.title
          ? chapter.title
          : `Chapter ${lastChapterIndex + 1}`;

        setResumeInfo({
          storyId: lastStoryId,
          storyTitle: storyData.title,
          chapterLabel,
          coverImage: storyData.cover_image || null,
        });
      } catch (error) {
        console.error("Failed to fetch resume story:", error);
        setResumeInfo(null);
      } finally {
        if (active) setIsFetchingResume(false);
      }
    };

    fetchResumeStory();

    return () => {
      active = false;
    };
  }, [lastStoryId, lastChapterIndex, username]);

  const tiles = useMemo(() => [
    { title: "Stories completed", value: formatNumber(stats.completedStories), icon: BookOpen, color: "text-emerald-400 bg-emerald-500/10" },
    { title: "Chapters read", value: formatNumber(stats.chaptersRead), icon: LayoutList, color: "text-blue-400 bg-blue-500/10" },
    { title: "Words read", value: formatNumber(stats.wordsRead), icon: Sparkles, color: "text-purple-400 bg-purple-500/10" },
    { title: "Reading minutes", value: formatNumber(stats.estimatedMinutes), icon: Clock3, color: "text-amber-400 bg-amber-500/10" },
  ], [stats]);

  const maxActivity = Math.max(...monthlyActivity, 1);
  const activityPoints = monthlyActivity.map((val, i) => {
    const x = (i / 5) * 100;
    const y = 80 - (val / maxActivity) * 60; 
    return `${x},${y}`;
  }).join(' ');
  const activityAreaPoints = `0,80 ${activityPoints} 100,80`;

  const totalEngagement = stats.ratingsGiven + stats.commentsMade + stats.likesGiven;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const getDash = (val: number) => `${(val / (totalEngagement || 1)) * circumference} ${circumference}`;

  return (
    <main className="min-h-screen px-4 sm:px-6 pt-8 pb-24 max-w-7xl mx-auto">
      <Toaster theme="dark" position="top-center" />
      {showMaintenanceAlert && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="fixed inset-x-0 top-4 z-50 mx-auto max-w-3xl px-4"
        >
          <div className="relative rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 shadow-xl backdrop-blur-md text-white">
            <div className="absolute right-3 top-3">
              <button
                onClick={() => setShowMaintenanceAlert(false)}
                className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
                aria-label="Dismiss maintenance alert"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/90 mb-2">Maintenance notice</p>
            <p className="text-sm text-white/90">
              This page is currently under maintenance. Some analytics may not load, but everything else is working fine. This message will disappear in about 10 seconds.
            </p>
          </div>
        </motion.div>
      )}
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-brand/10 text-brand">
              <UserCircle size={28} />
            </div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gray-light/70 font-semibold">
              {username ? `Welcome back, ${username}` : "Your reader dashboard"}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-brand bg-clip-text text-transparent max-w-3xl leading-tight">
            {username ? greetingMessages[greetingIndex] : "Sign in to see your reading history."}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push("/library")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} /> Library
          </button>

          {username ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy-dark shadow-lg shadow-brand/20 hover:brightness-110 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resume Card */}
          {username && resumeInfo && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-2 border border-white/10 overflow-hidden shadow-xl"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {resumeInfo.coverImage && (
                  <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-navy-dark">
                    <img src={resumeInfo.coverImage} alt={resumeInfo.storyTitle} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col justify-center p-4 sm:p-6 flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand mb-2 font-bold">Continue where you left off</p>
                  <h2 className="text-2xl font-bold text-white mb-1">{resumeInfo.storyTitle}</h2>
                  <p className="text-sm text-gray-light/60 mb-6">{resumeInfo.chapterLabel}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => router.push(`/read/${resumeInfo.storyId}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy-dark hover:brightness-110 transition shadow-lg shadow-brand/20"
                    >
                      <BookOpen size={16} /> Resume reading
                    </button>
                    <button
                      onClick={() => router.push("/library")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Browse library
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {username ? (
            <>
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Line Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="glass rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-light/50 mb-1">Reading Journey</p>
                      <p className="text-lg font-bold text-white">Last 6 Months</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="h-32 w-full">
                    <svg viewBox="0 0 100 80" className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={activityAreaPoints} fill="url(#chartGradient)" />
                      <polyline points={activityPoints} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-light/40 font-medium">
                    {["6m ago", "5m", "4m", "3m", "2m", "Now"].map((m, i) => <span key={i}>{m}</span>)}
                  </div>
                </motion.div>

                {/* Engagement Donut Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="glass rounded-2xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-light/50 mb-1">Community Engagement</p>
                      <p className="text-lg font-bold text-white">Your Interactions</p>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Sparkles size={20} />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                        {totalEngagement > 0 && (
                          <>
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={getDash(stats.ratingsGiven)} strokeDashoffset="0" strokeLinecap="round" />
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray={getDash(stats.commentsMade)} strokeDashoffset={`-${(stats.ratingsGiven / totalEngagement) * circumference}`} strokeLinecap="round" />
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#ec4899" strokeWidth="12" strokeDasharray={getDash(stats.likesGiven)} strokeDashoffset={`-${((stats.ratingsGiven + stats.commentsMade) / totalEngagement) * circumference}`} strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl font-bold text-white">{totalEngagement}</p>
                        <p className="text-[10px] text-gray-light/50 uppercase tracking-wider">Total</p>
                      </div>
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-light/70"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Ratings</span>
                        <span className="font-bold text-white">{stats.ratingsGiven}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-light/70"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Comments</span>
                        <span className="font-bold text-white">{stats.commentsMade}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-light/70"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Likes</span>
                        <span className="font-bold text-white">{stats.likesGiven}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiles.map((tile, idx) => {
                  const Icon = tile.icon;
                  return (
                    <motion.div
                      key={tile.title}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.05) }}
                      className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`rounded-xl p-2.5 ${tile.color}`}>
                          <Icon size={20} />
                        </div>
                        <p className="text-2xl font-bold text-white">{tile.value}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-light/80">{tile.title}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent reads list */}
              {perStoryStats.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 border border-white/10">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-gray-light/50 mb-3">Recent reads</h3>
                  <div className="space-y-3">
                    {perStoryStats.slice(0, 6).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-white/5 transition">
                        <div className="w-12 h-16 bg-navy-dark rounded overflow-hidden flex-shrink-0">
                          {item.cover_image ? <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-white truncate">{item.title}</p>
                            <p className="text-xs text-gray-light/50 flex-shrink-0">{item.chapters} ch</p>
                          </div>
                          <p className="text-xs text-gray-light/60 truncate">{formatNumber(item.words)} words • {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "—"}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <button onClick={() => router.push(`/read/${item.id}`)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-navy-dark text-xs font-semibold">Read</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </>
          ) : (
            <div className="glass rounded-2xl p-8 border border-white/10 text-center">
              <p className="text-gray-light/70 mb-4">Your reading stats will appear here after you sign in and start completing stories.</p>
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-navy-dark shadow-lg shadow-brand/20 hover:brightness-110 transition"
              >
                Sign in now
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}