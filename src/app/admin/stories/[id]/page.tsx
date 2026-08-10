// src/app/admin/stories/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Save, Loader2, Check, X, Upload, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";
import mammoth from "mammoth";

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  price_mwk: z.number().min(0, "Price cannot be negative"), // Changed to z.number()
  is_locked: z.boolean(),
});

type StoryForm = z.infer<typeof storySchema>;

interface Chapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentCover, setCurrentCover] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // DOCX State
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [extractedChapters, setExtractedChapters] = useState<Chapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [hasNewDocx, setHasNewDocx] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StoryForm>({
    resolver: zodResolver(storySchema),
  });

  // 1. Fetch existing story data
  useEffect(() => {
    const fetchStory = async () => {
      const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).single();
      
      if (error || !data) {
        toast.error("Story not found.");
        router.push("/admin/stories");
        return;
      }

      setValue("title", data.title);
      setValue("description", data.description);
      setValue("category", data.category);
      setValue("price_mwk", data.price_mwk);
      setValue("is_locked", data.is_locked);
      setCurrentCover(data.cover_image);
      setIsLoading(false);
    };

    fetchStory();
  }, [storyId, router, setValue]);

  // 2. Parse new DOCX if uploaded
  const handleDocxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocxFile(file);
    setHasNewDocx(true);
    setIsParsing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const elements = Array.from(doc.body.children);

      const chapters: Chapter[] = [];
      let currentChapter: Chapter | null = null;

      // Using a standard for...of loop fixes the TypeScript 'never' bug
      for (const el of elements) {
        if (el.tagName === 'H1' || el.tagName === 'H2') {
          if (currentChapter && currentChapter.paragraphs.length > 0) {
            chapters.push(currentChapter);
          }
          currentChapter = { 
            id: crypto.randomUUID(), 
            title: el.textContent || 'Untitled', 
            paragraphs: [] 
          };
        } else {
          if (!currentChapter) {
            currentChapter = { 
              id: crypto.randomUUID(), 
              title: 'Prologue', 
              paragraphs: [] 
            };
          }
          if (currentChapter && el.textContent?.trim()) {
            currentChapter.paragraphs.push(el.textContent.trim());
          }
        }
      }

      if (currentChapter && currentChapter.paragraphs.length > 0) {
        chapters.push(currentChapter);
      }

      setExtractedChapters(chapters);
      setSelectedChapterIds(chapters.map(c => c.id));
      toast.success(`Parsed ${chapters.length} new chapters!`);
    } catch (error) {
      toast.error("Failed to parse DOCX.");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleChapter = (id: string) => {
    setSelectedChapterIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

  // 3. Submit updates
  const onSubmit = async (data: StoryForm) => {
    setIsSubmitting(true);
    let finalCoverUrl = currentCover;

    try {
      // Upload new cover if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
        finalCoverUrl = urlData.publicUrl;
      }

      let updatePayload: any = {
        title: data.title,
        description: data.description,
        category: data.category,
        price_mwk: data.price_mwk,
        is_locked: data.is_locked,
        cover_image: finalCoverUrl,
      };

      // If a new DOCX was uploaded, update the content
      if (hasNewDocx && docxFile) {
        if (selectedChapterIds.length === 0) return toast.error("Select at least one chapter.");
        const finalChapters = extractedChapters
          .filter(ch => selectedChapterIds.includes(ch.id))
          .map(ch => ({ title: ch.title, content: ch.paragraphs }));
        updatePayload.content = finalChapters;
      }

      const { error } = await supabase.from('stories').update(updatePayload).eq('id', storyId);
      if (error) throw error;

      toast.success("Story updated successfully!");
      router.push("/admin/stories");

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-gray-light/50 text-center">Loading story data...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Edit Story</h1>
          <p className="text-gray-light/60 mt-1 text-sm sm:text-base">Update details or replace content.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
        
        {/* Current Cover Preview */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Current Cover</label>
          <div className="relative w-32 h-48 sm:w-40 sm:h-56 rounded-xl overflow-hidden bg-navy-dark border border-white/10 shadow-lg ring-1 ring-white/5">
            {currentCover ? (
              <img src={currentCover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-light/40 gap-2">
                <ImageIcon size={24} />
                <span className="text-xs">No Cover</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-light/80 block">Story Title</label>
          <input {...register("title")} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-light/80 block">Description</label>
          <textarea {...register("description")} rows={3} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all resize-none" />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Category</label>
            <input {...register("category")} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Price (MWK)</label>
            <input type="number" {...register("price_mwk", { valueAsNumber: true })} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 shadow-sm">
          <div>
            <p className="text-base font-semibold text-white">Premium Story?</p>
            <p className="text-xs text-gray-light/50 mt-0.5">Toggle to lock/unlock.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer active:scale-95 transition-transform">
            <input type="checkbox" {...register("is_locked")} className="sr-only peer" />
            <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
        </div>

        {/* Replace Cover Image */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-light/80 block">Replace Cover Image <span className="text-gray-light/40 font-normal">(Optional)</span></label>
          <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]">
            <Upload size={18} className="text-gray-light/60" />
            <span className="text-sm text-gray-light/80 font-medium truncate max-w-[200px]">
              {imageFile ? imageFile.name : "Choose Image"}
            </span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Replace DOCX Content */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <label className="text-sm font-medium text-gray-light/80 block">Replace Story Content (.docx) <span className="text-gray-light/40 font-normal">(Optional)</span></label>
          <p className="text-xs text-gray-light/50 mb-3">Only upload a new file if you want to change the chapters.</p>
          <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-emerald-500/30 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer active:scale-[0.98]">
            {isParsing ? (
              <><Loader2 size={18} className="animate-spin text-emerald-400" /> <span className="text-sm text-emerald-400 font-medium">Parsing Document...</span></>
            ) : (
              <>
                <FileText size={18} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium truncate max-w-[200px]">
                  {docxFile ? docxFile.name : "Upload .docx File"}
                </span>
              </>
            )}
            <input type="file" accept=".docx" onChange={handleDocxChange} className="hidden" disabled={isParsing} />
          </label>
        </div>

        {/* New Chapter Selection */}
        {hasNewDocx && extractedChapters.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-light/80 block">Select Chapters to Publish ({selectedChapterIds.length}/{extractedChapters.length})</label>
            <div className="max-h-72 overflow-y-auto space-y-2 p-2 bg-navy-dark/40 rounded-xl border border-white/5 shadow-inner">
              {extractedChapters.map((chapter, index) => {
                const isSelected = selectedChapterIds.includes(chapter.id);
                return (
                  <div 
                    key={`${chapter.id}-${index}`} 
                    onClick={() => toggleChapter(chapter.id)} 
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all active:scale-[0.98] ${
                      isSelected 
                        ? "bg-emerald-500/10 border border-emerald-500/30 shadow-sm" 
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <span className="text-sm sm:text-base text-white font-medium flex-1 truncate pr-2">{chapter.title}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-emerald-500' : 'bg-white/10'}`}>
                      {isSelected ? <Check size={14} className="text-white" /> : <X size={14} className="text-gray-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full py-4 text-base font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-transform" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Save Changes</>}
        </Button>
      </form>
    </div>
  );
}