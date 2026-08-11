//src/components/ui/StoryDetailsSheet.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Heart,
  BookOpen,
  Lock,
  Ticket,
  ShoppingBag,
  MessageSquare,
  Loader2
} from "lucide-react";
import { Story } from "@/types/story";
import { useUnlockStore } from "@/store/useUnlockStore";
import { useRouter } from "next/navigation";
import { Button } from "./Button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import HardCopyOrderModal from "@/components/ui/HardCopyOrderModal";

interface StoryDetailsSheetProps {
  story: Story | null;
  onClose: () => void;
  onUnlockClick: (story: Story) => void;
  onToggleLike: (storyId: string, isLiked: boolean) => void;
}

interface DbComment {
  id: string;
  story_id: string;
  user_id: string;
  username: string;
  comment: string;
  created_at: string;
}

interface DbRating {
  user_id: string;
  rating: number;
}

interface CommentWithRating extends DbComment {
  rating: number | null;
}

const COMMENTS_PAGE_SIZE = 20;

function formatCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export default function StoryDetailsSheet({
  story,
  onClose,
  onUnlockClick,
  onToggleLike
}: StoryDetailsSheetProps) {
  const router = useRouter();
  const isUnlocked = useUnlockStore((state) =>
    story ? state.isUnlocked(story.id) : false
  );

  const storyId = story?.id ?? null;

  const [comments, setComments] = useState<CommentWithRating[]>([]);
  const [commentsCount, setCommentsCount] = useState<number | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [currentUserCommented, setCurrentUserCommented] = useState(false);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  const [isHardCopyOrderOpen, setHardCopyOrderOpen] = useState(false);

  useEffect(() => {
    setHardCopyOrderOpen(false);
  }, [storyId]);

  useEffect(() => {
    if (!storyId) {
      setCurrentUserCommented(false);
      return;
    }

    let cancelled = false;

    const checkCurrentUserComment = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        if (!cancelled) setCurrentUserCommented(false);
        return;
      }

      const { data } = await supabase
        .from("story_comments")
        .select("id")
        .eq("story_id", storyId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setCurrentUserCommented(Boolean(data));
      }
    };

    setCurrentUserCommented(false);
    checkCurrentUserComment();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  useEffect(() => {
    if (!storyId) {
      setComments([]);
      setCommentsCount(null);
      setCommentsError(false);
      setLoadingComments(false);
      setLoadingMore(false);
      return;
    }

    let cancelled = false;

    const fetchComments = async () => {
      setLoadingComments(true);
      setCommentsError(false);
      setComments([]);
      setCommentsCount(null);

      // ONLY FETCH VISIBLE COMMENTS
      const { data, error, count } = await supabase
        .from("story_comments")
        .select("*", { count: "exact" })
        .eq("story_id", storyId)
        .eq("status", "visible") // <-- MODERATION FILTER
        .order("created_at", { ascending: false })
        .range(0, COMMENTS_PAGE_SIZE - 1);

      if (cancelled) return;

      if (error || !data) {
        console.error("Failed to fetch comments:", error);
        setCommentsError(true);
        setLoadingComments(false);
        return;
      }

      const commentsData = data as DbComment[];
      const total = count ?? commentsData.length;
      setCommentsCount(total);

      if (commentsData.length === 0) {
        setComments([]);
        setLoadingComments(false);
        return;
      }

      const userIds = Array.from(
        new Set(commentsData.map((comment) => comment.user_id))
      );

      const { data: ratingsData } = await supabase
        .from("story_ratings")
        .select("user_id, rating")
        .eq("story_id", storyId)
        .in("user_id", userIds);

      if (cancelled) return;

      const ratingMap = new Map<string, number>();
      (ratingsData as DbRating[] | null)?.forEach((ratingRow) => {
        ratingMap.set(ratingRow.user_id, ratingRow.rating);
      });

      setComments(
        commentsData.map((comment) => ({
          ...comment,
          rating: ratingMap.get(comment.user_id) ?? null
        }))
      );

      setLoadingComments(false);
    };

    fetchComments();

    return () => {
      cancelled = true;
    };
  }, [storyId, commentsRefreshKey]);

  const handleLoadMoreComments = async () => {
    if (!storyId || loadingComments || loadingMore) return;
    if (commentsCount !== null && comments.length >= commentsCount) return;

    setLoadingMore(true);

    const from = comments.length;
    const to = from + COMMENTS_PAGE_SIZE - 1;

    // ONLY FETCH VISIBLE COMMENTS
    const { data, error } = await supabase
      .from("story_comments")
      .select("*")
      .eq("story_id", storyId)
      .eq("status", "visible") // <-- MODERATION FILTER
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Failed to load more comments:", error);
      toast.error("Failed to load more comments.");
      setLoadingMore(false);
      return;
    }

    const moreComments = data as DbComment[];

    if (!moreComments || moreComments.length === 0) {
      setLoadingMore(false);
      return;
    }

    const userIds = Array.from(
      new Set(moreComments.map((comment) => comment.user_id))
    );

    const { data: ratingsData } = await supabase
      .from("story_ratings")
      .select("user_id, rating")
      .eq("story_id", storyId)
      .in("user_id", userIds);

    const ratingMap = new Map<string, number>();
    (ratingsData as DbRating[] | null)?.forEach((ratingRow) => {
      ratingMap.set(ratingRow.user_id, ratingRow.rating);
    });

    const mappedComments: CommentWithRating[] = moreComments.map((comment) => ({
      ...comment,
      rating: ratingMap.get(comment.user_id) ?? null
    }));

    setComments((prev) => {
      const existingIds = new Set(prev.map((comment) => comment.id));
      const uniqueNewComments = mappedComments.filter(
        (comment) => !existingIds.has(comment.id)
      );
      return [...prev, ...uniqueNewComments];
    });

    setLoadingMore(false);
  };

  const handleRead = async () => {
    if (!story) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to continue reading.");
      router.push("/login");
      return;
    }
    router.push(`/read/${story.id}`);
  };

  const handleUnlock = async () => {
    if (!story) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to unlock stories.");
      router.push("/login");
      return;
    }
    onUnlockClick(story);
    onClose();
  };

  const handleAccessCode = async () => {
    if (!story) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to unlock stories.");
      router.push("/login");
      return;
    }
    onUnlockClick(story);
    onClose();
  };

  const handleOpenHardCopy = async () => {
    if (!story) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to order a hard copy.");
      router.push("/login");
      return;
    }
    setHardCopyOrderOpen(true);
  };

  const handleToggleLikeClick = async () => {
    if (!story) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to like stories.");
      router.push("/login");
      return;
    }
    onToggleLike(story.id, Boolean(story.is_liked));
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const sheetVariants = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { type: "spring" as const, damping: 30, stiffness: 300 }
    },
    exit: {
      y: "100%",
      transition: { type: "spring" as const, damping: 30, stiffness: 300 }
    }
  } as const;

  const showReadButton = story ? !story.is_locked || isUnlocked : false;
  const showUnlockButtons = story ? story.is_locked && !isUnlocked : false;

  const avgRating = story?.average_rating;
  const ratingsCount = story?.ratings_count || 0;

  return (
    <AnimatePresence>
      {story && (
        <>
          <motion.div
            key="story-details-sheet-backdrop"
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            key="story-details-sheet"
            className="fixed bottom-0 left-0 right-0 z-[100] h-[85vh] max-h-[900px] bg-navy border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            dragSnapToOrigin={true}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150 || info.velocity.y > 500) {
                onClose();
              }
            }}
          >
            <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-light/70 z-10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="flex flex-row gap-4 sm:gap-6 mb-6">
                <div className="relative w-24 sm:w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-lg flex-shrink-0 border border-white/10">
                  <img
                    src={story.cover_image}
                    alt={`Cover of ${story.title}`}
                    className="w-full h-full object-cover"
                  />
                  {showUnlockButtons && (
                    <div className="absolute inset-0 bg-navy-dark/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-black/60 p-2 rounded-full border border-white/10">
                        <Lock size={16} className="text-white/90" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                    {story.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm text-gray-light/70">
                    <div className="flex items-center gap-1">
                      {avgRating ? (
                        <>
                          <Star
                            size={14}
                            className="text-yellow-500 fill-yellow-500"
                          />
                          <span>{avgRating.toFixed(1)}</span>
                          <span className="text-gray-light/50 text-xs ml-1">
                            ({ratingsCount})
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-light/50 text-xs">
                          No ratings yet
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLikeClick();
                      }}
                      className="flex items-center gap-1.5 hover:scale-105 transition-transform active:scale-95"
                    >
                      <Heart
                        size={16}
                        className={`transition-colors ${
                          story.is_liked
                            ? "text-red-500 fill-red-500"
                            : "text-gray-light/60"
                        }`}
                      />
                      <span>{formatCount(story.likes_count || 0)} likes</span>
                    </button>

                    {story.category && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-gray-light rounded-md uppercase tracking-wide">
                        {story.category}
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-brand/20 text-brand rounded-full">
                        Owned / Unlocked
                      </span>
                    ) : showUnlockButtons ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-accent-purple/20 text-accent-purple rounded-full">
                        <Lock size={12} /> Premium • {story.price_mwk} MWK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-brand/20 text-brand rounded-full">
                        Free to Read
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                  Synopsis
                </h3>
                <p className="text-gray-light/80 leading-relaxed text-sm sm:text-base">
                  {story.description ||
                    "No description available for this story."}
                </p>
              </div>

              <div className="space-y-3">
                {showReadButton && (
                  <Button
                    variant="primary"
                    className="w-full justify-center gap-2"
                    onClick={handleRead}
                  >
                    <BookOpen size={18} /> Read Story
                  </Button>
                )}

                {showUnlockButtons && (
                  <>
                    <Button
                      variant="primary"
                      className="w-full justify-center gap-2"
                      onClick={handleUnlock}
                    >
                      <Lock size={18} /> Unlock Story ({story.price_mwk} MWK)
                    </Button>

                    <Button
                      variant="secondary"
                      className="w-full justify-center gap-2"
                      onClick={handleAccessCode}
                    >
                      <Ticket size={18} /> I Have an Access Code
                    </Button>
                  </>
                )}

                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2"
                  onClick={handleOpenHardCopy}
                >
                  <ShoppingBag size={18} /> Order Hard Copy
                </Button>
              </div>

              <div className="mt-10">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Comments{commentsCount !== null ? ` · ${commentsCount}` : ""}
                  </h3>
                </div>

                {currentUserCommented && !loadingComments && !commentsError && (
                  <div className="mb-3 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2 text-xs text-brand">
                    You've already shared your thoughts on this story.
                  </div>
                )}

                {loadingComments ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-white/5 bg-white/5 p-4 animate-pulse"
                      >
                        <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                        <div className="h-3 w-16 bg-white/10 rounded mb-3" />
                        <div className="h-3 w-full bg-white/5 rounded mb-1" />
                        <div className="h-3 w-2/3 bg-white/5 rounded" />
                      </div>
                    ))}
                  </div>
                ) : commentsError ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center">
                    <p className="text-sm text-gray-light/70 mb-3">
                      Could not load comments.
                    </p>
                    <Button
                      variant="secondary"
                      className="mx-auto justify-center"
                      onClick={() =>
                        setCommentsRefreshKey((key) => key + 1)
                      }
                    >
                      Try again
                    </Button>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-center">
                    <MessageSquare
                      className="mx-auto text-gray-light/30 mb-2"
                      size={18}
                    />
                    <p className="text-sm text-white">No comments yet.</p>
                    <p className="text-xs text-gray-light/50">
                      Be the first reader to share your thoughts.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-white/5 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {comment.username}
                              </p>

                              {comment.rating !== null && (
                                <div className="flex items-center gap-0.5 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={12}
                                      className={
                                        star <= (comment.rating ?? 0)
                                          ? "text-yellow-500 fill-yellow-500"
                                          : "text-gray-light/20"
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <span className="text-[11px] text-gray-light/50 whitespace-nowrap">
                              {timeAgo(comment.created_at)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-light/80 whitespace-pre-wrap break-words">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>

                    {commentsCount !== null &&
                      comments.length < commentsCount && (
                        <Button
                          variant="secondary"
                          className="w-full justify-center gap-2 mt-3"
                          onClick={handleLoadMoreComments}
                          disabled={loadingMore}
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Load more comments"
                          )}
                        </Button>
                      )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <HardCopyOrderModal
            open={isHardCopyOrderOpen}
            story={story}
            onClose={() => setHardCopyOrderOpen(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
}