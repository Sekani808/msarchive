"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Eye, EyeOff, Filter, Trash2, RefreshCw, Star } from "lucide-react";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/Button";

interface AdminComment {
  id: string;
  story_id: string;
  user_id: string;
  username: string;
  comment: string;
  status: "visible" | "hidden" | "deleted";
  created_at: string;
  stories?: { title: string };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden" | "deleted">("all");

  const [stats, setStats] = useState({
    total: 0,
    visible: 0,
    hidden: 0,
  });

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("story_comments")
      .select("*, stories(title)")
      .order("created_at", { ascending: false });

    if (data) {
      setComments(data as AdminComment[]);
      setStats({
        total: data.length,
        visible: data.filter(c => c.status === "visible").length,
        hidden: data.filter(c => c.status === "hidden").length,
      });
    }
    setIsLoading(false);
  };

  const updateCommentStatus = async (id: string, newStatus: "visible" | "hidden" | "deleted") => {
    const { error } = await supabase
      .from("story_comments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update comment.");
      console.error(error);
      return;
    }

    toast.success(`Comment ${newStatus === "visible" ? "restored" : newStatus}.`);
    fetchComments();
  };

  const filteredComments = comments.filter(c => 
    filterStatus === "all" || c.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "visible": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">VISIBLE</span>;
      case "hidden": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400">HIDDEN</span>;
      case "deleted": return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">DELETED</span>;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-light/50">Loading comments...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Comments</h1>
        <p className="text-gray-light/60 mt-1">Moderate reader feedback and reviews.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Total Comments</p>
            <MessageSquare className="text-brand" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Visible</p>
            <Eye className="text-green-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.visible}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-light/60">Hidden/Removed</p>
            <EyeOff className="text-yellow-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-white">{stats.hidden}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <Filter size={18} className="text-gray-light/50" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="glass rounded-lg py-2 px-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Comments</option>
          <option value="visible">Visible Only</option>
          <option value="hidden">Hidden Only</option>
          <option value="deleted">Deleted Only</option>
        </select>
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <MessageSquare className="mx-auto text-gray-light/30 mb-4" size={48} />
          <p className="text-gray-light/50">No comments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`glass rounded-2xl p-5 ${comment.status !== "visible" ? "opacity-60" : ""}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <p className="font-bold text-white">{comment.username}</p>
                    {getStatusBadge(comment.status)}
                    <span className="text-xs text-gray-light/50">
                      on <strong className="text-gray-light/80">{comment.stories?.title || "Unknown Story"}</strong>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-light/80 mb-3 whitespace-pre-wrap break-words">
                    {comment.comment}
                  </p>

                  <p className="text-xs text-gray-light/40">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 self-start flex-shrink-0">
                  {comment.status !== "visible" && (
                    <button
                      onClick={() => updateCommentStatus(comment.id, "visible")}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-full transition-colors"
                      title="Restore Comment"
                    >
                      <RefreshCw size={18} />
                    </button>
                  )}
                  
                  {comment.status === "visible" && (
                    <button
                      onClick={() => updateCommentStatus(comment.id, "hidden")}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-full transition-colors"
                      title="Hide Comment"
                    >
                      <EyeOff size={18} />
                    </button>
                  )}

                  {comment.status !== "deleted" && (
                    <button
                      onClick={() => {
                        if(confirm("Are you sure you want to permanently mark this comment as deleted?")) {
                          updateCommentStatus(comment.id, "deleted");
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Comment"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}