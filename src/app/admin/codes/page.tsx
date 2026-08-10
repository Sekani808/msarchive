// src/app/admin/codes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Key, Plus, Trash2, Copy, Filter, RefreshCw, User, Smartphone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";

interface UnlockCode {
  id: string;
  code: string;
  story_id: string;
  purchaser_name: string; 
  max_devices: number;
  devices_used: number;
  is_revoked: boolean; 
  expires_at: string | null;
  created_at: string;
  stories?: { title: string };
}

interface Story {
  id: string;
  title: string;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<UnlockCode[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  // Generate form state
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [purchaserName, setPurchaserName] = useState(""); 
  const [batchSize, setBatchSize] = useState(1);
  const [maxDevices, setMaxDevices] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filter state
  const [filterStory, setFilterStory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchCodes();
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data } = await supabase.from("stories").select("id, title");
    if (data) setStories(data);
  };

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("unlock_codes")
      .select("*, stories(title)")
      .order("created_at", { ascending: false });

    if (data) {
      setCodes(data);
    }
    setIsLoading(false);
  };

  const generateUniqueCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MS-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += "-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCodes = async () => {
    if (!selectedStoryId) return toast.error("Please select a story.");
    if (!purchaserName.trim()) return toast.error("Please enter purchaser full name.");
    if (batchSize < 1 || batchSize > 10) return toast.error("Batch size must be between 1 and 10.");

    setIsGenerating(true);

    try {
      const newCodes: string[] = []; 
      for (let i = 0; i < batchSize; i++) {
        let code = generateUniqueCode();
        while (newCodes.includes(code) || codes.some(c => c.code === code)) {
          code = generateUniqueCode();
        }
        newCodes.push(code);
      }

      const codesToInsert = newCodes.map(code => ({
        code,
        story_id: selectedStoryId,
        purchaser_name: purchaserName, 
        max_devices: maxDevices,
        devices_used: 0,
        is_revoked: false,
      }));

      const { error } = await supabase.from("unlock_codes").insert(codesToInsert);

      if (error) throw error;

      toast.success(`Generated ${batchSize} code(s) successfully!`);
      fetchCodes();
      setShowGenerateForm(false);
      setSelectedStoryId("");
      setPurchaserName("");
      setBatchSize(1);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to generate codes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeCode = async (id: string) => {
    if (!confirm("Revoke this code? This will reset its usage count and deduct the revenue until the user re-enters it.")) return;
    
    await supabase.from("unlock_codes").update({ 
      devices_used: 0, 
      is_revoked: true 
    }).eq("id", id);
    
    fetchCodes();
    toast.success("Code revoked. Revenue deducted.");
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this code?")) return;
    await supabase.from("unlock_codes").delete().eq("id", id);
    fetchCodes();
    toast.success("Code deleted.");
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const filteredCodes = codes.filter(code => {
    const matchesStory = filterStory === "all" || code.story_id === filterStory;
    const isUsed = code.devices_used >= code.max_devices;
    
    let matchesStatus = true;
    if (filterStatus === "unused") matchesStatus = !isUsed && !code.is_revoked;
    else if (filterStatus === "used") matchesStatus = isUsed && !code.is_revoked;
    else if (filterStatus === "revoked") matchesStatus = code.is_revoked;
    
    return matchesStory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <p className="text-gray-light/50 animate-pulse">Loading codes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Unlock Codes</h1>
          <p className="text-gray-light/60 mt-1 text-sm sm:text-base">Generate and manage story unlock codes.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowGenerateForm(!showGenerateForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-transform py-2.5 px-4"
        >
          <Plus size={18} />
          <span>{showGenerateForm ? "Close Form" : "Generate Codes"}</span>
        </Button>
      </div>

      {/* Generate Form */}
      {showGenerateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 sm:p-6 space-y-5 border border-white/10 shadow-xl"
        >
          <h2 className="text-lg sm:text-xl font-bold text-white">Generate New Codes</h2>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Select Story</label>
            <select
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(e.target.value)}
              className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all bg-navy-dark"
            >
              <option value="">Choose a story...</option>
              {stories.map(story => (
                <option key={story.id} value={story.id} className="bg-navy-dark">{story.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Purchaser Full Name</label>
            <input
              type="text"
              value={purchaserName}
              onChange={(e) => setPurchaserName(e.target.value)}
              placeholder="e.g. John Banda"
              className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-light/80 block">Batch Size <span className="text-gray-light/40 font-normal">(1-10)</span></label>
              <input
                type="number"
                min="1"
                max="10"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-light/80 block">Max Devices</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxDevices}
                onChange={(e) => setMaxDevices(parseInt(e.target.value) || 1)}
                className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="primary" onClick={handleGenerateCodes} disabled={isGenerating} className="w-full sm:w-auto flex-1 sm:flex-none py-3 text-base font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-transform">
              {isGenerating ? "Generating..." : "Generate Codes"}
            </Button>
            <Button variant="secondary" onClick={() => setShowGenerateForm(false)} className="w-full sm:w-auto py-3 text-base font-semibold active:scale-[0.98] transition-transform">
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-3 sm:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Filter size={16} className="text-gray-light/50" />
          <span className="text-sm font-medium text-gray-light/70">Filter Codes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={filterStory}
            onChange={(e) => setFilterStory(e.target.value)}
            className="w-full glass border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-navy-dark/50"
          >
            <option value="all">All Stories</option>
            {stories.map(story => (
              <option key={story.id} value={story.id} className="bg-navy-dark">{story.title}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full glass border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-navy-dark/50"
          >
            <option value="all">All Status</option>
            <option value="unused">Available</option>
            <option value="used">Maxed Out</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Codes List */}
      {filteredCodes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Key className="text-gray-light/40" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No codes found</h3>
          <p className="text-gray-light/50 text-sm">Try adjusting your filters or generate new codes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCodes.map((code, index) => {
            const isUsed = code.devices_used >= code.max_devices;
            const isRevoked = code.is_revoked;
            
            return (
              <motion.div
                key={code.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`glass rounded-2xl p-4 sm:p-5 border transition-all shadow-lg ${
                  isRevoked 
                    ? "opacity-80 border-yellow-500/30 bg-yellow-500/5" 
                    : isUsed 
                      ? "border-white/5 bg-white/5" 
                      : "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Top Row: Code & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="text-lg sm:text-xl font-mono font-bold text-emerald-400 tracking-wider truncate">{code.code}</code>
                      <button
                        onClick={() => copyCodeToClipboard(code.code)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-light/50 hover:text-white transition-colors active:scale-90 flex-shrink-0"
                        aria-label="Copy code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleRevokeCode(code.id)}
                        disabled={isRevoked}
                        className={`p-2.5 rounded-full transition-all active:scale-90 ${
                          isRevoked 
                            ? "text-gray-light/30 cursor-not-allowed" 
                            : "text-accent-blue hover:bg-accent-blue/10"
                        }`}
                        title="Revoke Code (Reset usage & deduct revenue)"
                        aria-label="Revoke code"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCode(code.id)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-full transition-all active:scale-90"
                        aria-label="Delete code"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Story & Status */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-white truncate flex-1">
                      {code.stories?.title || "Unknown Story"}
                    </p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      isRevoked ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                      isUsed ? "bg-red-500/20 text-red-400 border border-red-500/30" : 
                      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {isRevoked ? "REVOKED" : isUsed ? "MAXED OUT" : "AVAILABLE"}
                    </span>
                  </div>

                  {/* Bottom Row: Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-light/60 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <User size={12} className="text-gray-light/40" />
                      <span className="truncate max-w-[120px]">{code.purchaser_name || "Unknown"}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={12} className="text-gray-light/40" />
                      {code.devices_used}/{code.max_devices} Devices
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-light/40" />
                      {new Date(code.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}