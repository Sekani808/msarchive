// src/app/admin/codes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Key, Plus, Trash2, Copy, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { toast, Toaster } from "sonner";

interface UnlockCode {
  id: string;
  code: string;
  story_id: string;
  purchaser_name: string; // Changed from purchaser_phone
  max_devices: number;
  devices_used: number;
  is_revoked: boolean; // New field
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
  const [purchaserName, setPurchaserName] = useState(""); // Changed from purchaserPhone
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
      const newCodes: string[] = []; // Added `: string[]`
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
        purchaser_name: purchaserName, // Save the name
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

  // NEW: Revoke Code Function
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

  // Filter logic
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
    return <div className="p-8 text-gray-light/50">Loading codes...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Unlock Codes</h1>
          <p className="text-gray-light/60 mt-1">Generate and manage story unlock codes.</p>
        </div>
        <Button variant="primary" onClick={() => setShowGenerateForm(!showGenerateForm)}>
          <Plus size={18} />
          Generate Codes
        </Button>
      </div>

      {/* Generate Form */}
      {showGenerateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-white">Generate New Codes</h2>
          
          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Select Story</label>
            <select
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(e.target.value)}
              className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <option value="">Choose a story...</option>
              {stories.map(story => (
                <option key={story.id} value={story.id}>{story.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Purchaser Full Name</label>
            <input
              type="text"
              value={purchaserName}
              onChange={(e) => setPurchaserName(e.target.value)}
              placeholder="e.g. John Banda"
              className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-light/80 mb-2 block">Batch Size (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-light/80 mb-2 block">Max Devices</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxDevices}
                onChange={(e) => setMaxDevices(parseInt(e.target.value) || 1)}
                className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleGenerateCodes} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Codes"}
            </Button>
            <Button variant="secondary" onClick={() => setShowGenerateForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-light/50" />
          <select
            value={filterStory}
            onChange={(e) => setFilterStory(e.target.value)}
            className="glass rounded-lg py-2 px-3 text-sm text-white focus:outline-none"
          >
            <option value="all">All Stories</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="glass rounded-lg py-2 px-3 text-sm text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="unused">Available</option>
            <option value="used">Used</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Codes List */}
      {filteredCodes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Key className="mx-auto text-gray-light/30 mb-4" size={48} />
          <p className="text-gray-light/50">No codes found.</p>
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
                transition={{ delay: index * 0.05 }}
                className={`glass rounded-2xl p-5 ${isRevoked ? "opacity-60 border-l-4 border-yellow-500" : ""}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-mono font-bold text-brand">{code.code}</code>
                      <button
                        onClick={() => copyCodeToClipboard(code.code)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-light/50 hover:text-white transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      {isRevoked && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400">
                          REVOKED
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="text-gray-light/70">
                        <strong className="text-white">Story:</strong> {code.stories?.title || "Unknown"}
                      </span>
                      <span className="text-gray-light/70">
                        <strong className="text-white">Name:</strong> {code.purchaser_name || "Unknown"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isRevoked ? "bg-yellow-500/20 text-yellow-400" :
                        isUsed ? "bg-red-500/20 text-red-400" : "bg-brand/20 text-brand"
                      }`}>
                        {isRevoked ? "REVOKED" : isUsed ? "MAXED OUT" : "AVAILABLE"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-light/40 mt-2">
                      Created: {new Date(code.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 self-start">
                    {/* Revoke Button */}
                    <button
                      onClick={() => handleRevokeCode(code.id)}
                      disabled={isRevoked}
                      className={`p-2 rounded-full transition-colors ${
                        isRevoked 
                          ? "text-gray-light/30 cursor-not-allowed" 
                          : "text-accent-blue hover:bg-accent-blue/10"
                      }`}
                      title="Revoke Code (Reset usage & deduct revenue)"
                    >
                      <RefreshCw size={18} />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteCode(code.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
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