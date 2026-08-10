// src/components/reader/Reader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Minus,
  Plus,
  Sun,
  Moon,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Star,
  Loader2,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useReadingStore } from "@/store/useReadingStore";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";

interface Chapter {
  title: string;
  content: string[];
}

interface ReaderProps {
  storyId: string;
  title: string;
  chapters: Chapter[];
}

const MAX_USERNAME_LENGTH = 50;
const MAX_COMMENT_LENGTH = 500;

export default function Reader({ storyId, title, chapters }: ReaderProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const { setLastRead, lastStoryId, lastChapterIndex } = useReadingStore();

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const hasCompletedRef = useRef(false);
  const currentChapterIndexRef = useRef(currentChapterIndex);

  const [isCompleted, setIsCompleted] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hasCommented, setHasCommented] = useState(false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentUsername, setCommentUsername] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    currentChapterIndexRef.current = currentChapterIndex;
  }, [currentChapterIndex]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (lastStoryId === storyId && lastChapterIndex > 0 && lastChapterIndex < chapters.length) {
      setCurrentChapterIndex(lastChapterIndex);
    }
  }, [storyId, lastStoryId, lastChapterIndex, chapters.length]);

  useEffect(() => {
    const savedFont = localStorage.getItem("msarchive-reader-fontsize");
    const savedTheme = localStorage.getItem("msarchive-reader-theme");

    if (savedFont) setFontSize(parseInt(savedFont, 10));
    if (savedTheme) setIsDarkMode(savedTheme === "dark");
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("msarchive-reader-fontsize", fontSize.toString());
    }
  }, [fontSize, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("msarchive-reader-theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, isClient]);

  const currentChapter = chapters[currentChapterIndex];

  useEffect(() => {
    setLastRead(storyId, currentChapterIndex);
  }, [currentChapterIndex, storyId, setLastRead]);

  /**
   * Fetch existing completion/rating/comment state from Supabase.
   * This keeps Reader consistent across page reloads and navigation.
   */
  useEffect(() => {
    let cancelled = false;

    const fetchExistingState = async () => {
      hasCompletedRef.current = false;
      setIsCompleted(false);
      setHasRated(false);
      setUserRating(null);
      setHasCommented(false);
      setShowCommentForm(false);
      setCommentUsername("");
      setCommentText("");
      setSelectedRating(0);

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const [completionRes, ratingRes, commentRes] = await Promise.all([
        supabase
          .from("story_completions")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("story_ratings")
          .select("rating")
          .eq("story_id", storyId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("story_comments")
          .select("id")
          .eq("story_id", storyId)
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (cancelled) return;

      if (completionRes.data) {
        hasCompletedRef.current = true;
        setIsCompleted(true);
      }

      const existingRating = ratingRes.data as { rating: number } | null;
      if (existingRating) {
        setHasRated(true);
        setUserRating(existingRating.rating);
        setSelectedRating(existingRating.rating);
      }

      if (commentRes.data) {
        setHasCommented(true);
      }
    };

    fetchExistingState();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  /**
   * Scroll handling for progress, controls, and completion detection.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const markAsCompleted = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error } = await supabase
          .from("story_completions")
          .upsert({ story_id: storyId, user_id: user.id }, { onConflict: "story_id,user_id" });

        if (!error) {
          setIsCompleted(true);
        } else {
          console.error("Completion tracking failed:", error);
        }
      } catch (error) {
        console.error("Completion tracking failed:", error);
      }
    };

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      const scrollableHeight = scrollHeight - clientHeight;
      const scrollPercent = scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));

      if (scrollTop < 50) {
        setIsControlsVisible(true);
      } else if (scrollTop > lastScrollTop.current && scrollTop > 100) {
        setIsControlsVisible(false);
      } else if (scrollTop < lastScrollTop.current) {
        setIsControlsVisible(true);
      }

      lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;

      const isLastChapter = currentChapterIndexRef.current === chapters.length - 1;
      const isAtBottom = scrollableHeight > 0 && scrollHeight - scrollTop - clientHeight < 50;

      if (isLastChapter && isAtBottom && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        markAsCompleted();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [storyId, chapters.length]);

  /**
   * Existing story view tracking.
   */
  useEffect(() => {
    let deviceId = localStorage.getItem("msarchive_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("msarchive_device_id", deviceId);
    }

    const viewedStories = JSON.parse(localStorage.getItem("msarchive_viewed_stories") || "[]");

    if (!viewedStories.includes(storyId)) {
      const trackView = async () => {
        await supabase.from("story_views").insert({
          story_id: storyId,
          device_id: deviceId
        });

        viewedStories.push(storyId);
        localStorage.setItem("msarchive_viewed_stories", JSON.stringify(viewedStories));
      };

      trackView();
    }
  }, [storyId]);

  const handleSubmitRating = async () => {
    if (!selectedRating) return;

    setIsSubmittingRating(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to rate a story.");
        setIsSubmittingRating(false);
        return;
      }

      const { data: completion, error: completionError } = await supabase
        .from("story_completions")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (completionError || !completion) {
        toast.error("You must complete the story before rating it.");
        setIsSubmittingRating(false);
        return;
      }

      const { error: ratingError } = await supabase
        .from("story_ratings")
        .upsert(
          { story_id: storyId, user_id: user.id, rating: selectedRating },
          { onConflict: "story_id,user_id" }
        );

      if (ratingError) {
        toast.error("Failed to submit rating. Please try again.");
      } else {
        setHasRated(true);
        setUserRating(selectedRating);
        setShowRatingModal(false);
        toast.success("Thank you for your rating!");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSubmitComment = async () => {
    const username = commentUsername.trim();
    const comment = commentText.trim();

    if (!username) {
      toast.error("Please enter a username.");
      return;
    }

    if (username.length > MAX_USERNAME_LENGTH) {
      toast.error(`Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`);
      return;
    }

    if (!comment) {
      toast.error("Please enter a comment.");
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
      return;
    }

    setIsSubmittingComment(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to comment.");
        setIsSubmittingComment(false);
        return;
      }

      const { data: completion, error: completionError } = await supabase
        .from("story_completions")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (completionError || !completion) {
        toast.error("You must complete the story before commenting.");
        setIsSubmittingComment(false);
        return;
      }

      const { data: rating, error: ratingError } = await supabase
        .from("story_ratings")
        .select("rating")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ratingError || !rating) {
        toast.error("Please rate the story before commenting.");
        setIsSubmittingComment(false);
        return;
      }

      const { error: insertError } = await supabase.from("story_comments").insert({
        story_id: storyId,
        user_id: user.id,
        username,
        comment
      });

      if (insertError) {
        if (insertError.code === "23505") {
          setHasCommented(true);
          setShowCommentForm(false);
          toast.error("You have already commented on this story.");
        } else {
          toast.error("Failed to submit comment. Please try again.");
        }
      } else {
        setHasCommented(true);
        setShowCommentForm(false);
        setCommentUsername("");
        setCommentText("");
        toast.success("Comment submitted. Thank you for sharing!");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const bgClass = isDarkMode ? "bg-navy-dark" : "bg-gray-50";
  const textClass = isDarkMode ? "text-gray-light" : "text-navy-dark";
  const controlBg = isDarkMode ? "bg-navy/95" : "bg-white/95";
  const controlText = isDarkMode ? "text-gray-light" : "text-navy-dark";
  const borderClass = isDarkMode ? "border-white/5" : "border-black/5";
  const hoverClass = isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5";

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 ${
    isDarkMode
      ? "bg-white/5 border-white/10 text-white placeholder-gray-light/40"
      : "bg-white border-black/10 text-navy-dark placeholder-navy-dark/40"
  }`;

  const subtleButtonClass = `inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border ${borderClass} transition-all ${hoverClass} ${controlText}`;

  const goToNext = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  const goToPrev = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
      if (containerRef.current) containerRef.current.scrollTop = 0;
    }
  };

  const parseChapterTitle = (chapterTitle: string) => {
    const match = chapterTitle.match(/^(Chapter\s+[A-Za-z0-9]+|[0-9]+)\s*[:\-\.]?\s*(.+)$/i);
    if (match && match[2]) {
      return { label: match[1], main: match[2] };
    }
    return { label: null, main: chapterTitle };
  };

  const parsedTitle = currentChapter
    ? parseChapterTitle(currentChapter.title)
    : { label: null, main: title };

  const displayedRating = userRating ?? selectedRating;

  return (
    <div className={`fixed inset-0 flex flex-col ${bgClass} transition-colors duration-300`}>
      <Toaster theme="dark" position="top-center" />

      {/* Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-black/10"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <motion.div
          className="h-full bg-brand"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Top Control Bar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: isControlsVisible ? 0 : -100 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-40 ${controlBg} backdrop-blur-md border-b ${borderClass}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className={`p-2 rounded-full ${hoverClass} ${controlText}`}
          >
            <ArrowLeft size={20} />
          </button>

          <h2 className={`text-sm font-semibold truncate max-w-[50%] ${controlText}`}>
            {currentChapter?.title || title}
          </h2>

          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open chapters"
            className={`p-2 rounded-full ${hoverClass} ${controlText}`}
          >
            <List size={20} />
          </button>
        </div>
      </motion.header>

      {/* Reading Content Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth">
        <article
          className={`max-w-2xl mx-auto px-5 sm:px-8 pt-24 pb-32 ${textClass}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <header className="mb-8">
            {parsedTitle.label && (
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
                {parsedTitle.label}
              </p>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{parsedTitle.main}</h1>
          </header>

          <div className="space-y-5">
            {currentChapter?.content.map((paragraph, index) => (
              <p key={index} className="leading-[1.75] text-left">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Chapter Navigation */}
          <div className={`mt-16 pt-8 border-t ${borderClass}`}>
            {currentChapterIndex === chapters.length - 1 ? (
              <div className="text-center space-y-6">
                <h3 className="text-xl font-bold text-brand">End of Story</h3>
                <p className={`text-sm ${isDarkMode ? "text-gray-light/70" : "text-navy-dark/70"}`}>
                  You have reached the end of {title}.
                </p>

                <div className="space-y-4">
                  {/* Rate CTA */}
                  {isCompleted && !hasRated && (
                    <div className="space-y-3">
                      <p className={`text-sm font-medium ${controlText}`}>How did you find this story?</p>
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-purple text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Star size={18} /> Rate This Story
                      </button>
                    </div>
                  )}

                  {/* Rated state */}
                  {hasRated && (
                    <div className="space-y-3">
                      <p className="text-brand font-semibold">Thank you for rating this story.</p>
                      <div className="flex justify-center gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={star <= displayedRating ? "fill-yellow-500" : ""}
                          />
                        ))}
                      </div>

                      {hasCommented ? (
                        <p className={`text-sm ${controlText} opacity-80`}>
                          You've already shared your thoughts on this story.
                        </p>
                      ) : (
                        !showCommentForm && (
                          <button
                            onClick={() => setShowCommentForm(true)}
                            className={subtleButtonClass}
                          >
                            <MessageSquare size={18} /> Leave a Comment
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Optional comment form */}
                  {showCommentForm && !hasCommented && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-left rounded-2xl border ${borderClass} p-4 sm:p-5 space-y-4 ${
                        isDarkMode ? "bg-white/5" : "bg-white"
                      }`}
                    >
                      <div>
                        <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${controlText}`}>
                          Username
                        </label>
                        <input
                          value={commentUsername}
                          onChange={(e) => setCommentUsername(e.target.value)}
                          maxLength={MAX_USERNAME_LENGTH}
                          placeholder="Your display name"
                          className={inputClass}
                        />
                        <p className={`mt-1 text-xs ${controlText} opacity-60`}>
                          {commentUsername.length} / {MAX_USERNAME_LENGTH}
                        </p>
                      </div>

                      <div>
                        <label className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${controlText}`}>
                          Your comment
                        </label>
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={4}
                          maxLength={MAX_COMMENT_LENGTH}
                          placeholder="Share your thoughts about this story..."
                          className={`${inputClass} resize-none`}
                        />
                        <p className={`mt-1 text-xs ${controlText} opacity-60`}>
                          {commentText.length} / {MAX_COMMENT_LENGTH}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={
                            isSubmittingComment ||
                            !commentUsername.trim() ||
                            !commentText.trim()
                          }
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand text-navy-dark font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? (
                            <>
                              <Loader2 size={18} className="animate-spin" /> Submitting...
                            </>
                          ) : (
                            <>
                              <MessageSquare size={18} /> Submit Comment
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setShowCommentForm(false)}
                          disabled={isSubmittingComment}
                          className={`${subtleButtonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={() => router.push("/library")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-navy-dark font-semibold hover:opacity-90 transition-opacity"
                >
                  <Home size={18} /> Return to Library
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={goToPrev}
                  disabled={currentChapterIndex === 0}
                  aria-label="Previous Chapter"
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border ${borderClass} transition-all ${
                    currentChapterIndex === 0 ? "opacity-30 cursor-not-allowed" : hoverClass
                  } ${controlText}`}
                >
                  <ChevronLeft size={18} /> Previous
                </button>

                <button
                  onClick={() => router.push("/library")}
                  aria-label="Return to Library"
                  className={`p-3 rounded-full ${hoverClass} text-brand transition-colors`}
                >
                  <Home size={20} />
                </button>

                <button
                  onClick={goToNext}
                  aria-label="Next Chapter"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Bottom Settings Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: isControlsVisible ? 0 : 100 }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        className={`fixed bottom-0 left-0 right-0 z-40 ${controlBg} backdrop-blur-md border-t ${borderClass}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-6 h-16 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              aria-label="Decrease text size"
              className={`p-2 rounded-full ${hoverClass} ${controlText} disabled:opacity-30`}
              disabled={fontSize <= 14}
            >
              <Minus size={18} />
            </button>
            <span className={`text-xs font-bold w-6 text-center tabular-nums ${controlText}`}>
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              aria-label="Increase text size"
              className={`p-2 rounded-full ${hoverClass} ${controlText} disabled:opacity-30`}
              disabled={fontSize >= 28}
            >
              <Plus size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle reading theme"
            className={`p-2 rounded-full ${hoverClass} ${controlText}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </motion.div>

      {/* Chapter Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-sm ${bgClass} z-50 shadow-2xl flex flex-col border-r ${borderClass}`}
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              <div className={`px-5 py-4 border-b ${borderClass} flex justify-between items-center ${controlBg}`}>
                <h3 className={`font-bold ${controlText}`}>Chapters</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close chapters"
                  className={`p-2 rounded-full ${hoverClass} ${controlText}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentChapterIndex(index);
                      setIsDrawerOpen(false);
                      if (containerRef.current) containerRef.current.scrollTop = 0;
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      index === currentChapterIndex
                        ? "bg-brand text-navy-dark"
                        : `${controlText} ${hoverClass}`
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

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
              onClick={() => !isSubmittingRating && setShowRatingModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none"
            >
              <div
                className={`w-full max-w-sm ${controlBg} border ${borderClass} rounded-3xl p-6 shadow-2xl pointer-events-auto`}
              >
                <h3 className={`text-xl font-bold text-center mb-2 ${controlText}`}>How was the story?</h3>
                <p className={`text-center text-sm mb-6 ${isDarkMode ? "text-gray-light/70" : "text-navy-dark/70"}`}>
                  Share your thoughts on "{title}"
                </p>

                <div className="flex justify-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      disabled={isSubmittingRating}
                      className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    >
                      <Star
                        size={40}
                        className={`transition-colors ${
                          (hoverRating || selectedRating) >= star
                            ? "text-yellow-500 fill-yellow-500"
                            : isDarkMode
                              ? "text-gray-light/30"
                              : "text-navy-dark/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSubmitRating}
                  disabled={!selectedRating || isSubmittingRating}
                  className="w-full py-3 rounded-xl bg-brand text-navy-dark font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingRating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </button>

                <button
                  onClick={() => setShowRatingModal(false)}
                  disabled={isSubmittingRating}
                  className={`w-full mt-3 py-2 text-sm ${controlText} opacity-70 hover:opacity-100 disabled:opacity-30`}
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}