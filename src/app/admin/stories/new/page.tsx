// src/app/admin/stories/new/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";
import mammoth from "mammoth";

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  price_mwk: z.number().min(0, "Price cannot be negative"),
  is_locked: z.boolean(),
});

type StoryForm = z.infer<typeof storySchema>;

// Define the structure of a chapter
interface Chapter {
  id: string;
  title: string;
  paragraphs: string[];
}

export default function NewStoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedChapters, setExtractedChapters] = useState<Chapter[]>([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<StoryForm>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      price_mwk: 0,
      is_locked: false,
    },
  });

  // 2. Parse new DOCX if uploaded
  const handleDocxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocxFile(file);
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
    setSelectedChapterIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: StoryForm) => {
    if (!docxFile) return toast.error("Please select a DOCX file.");
    if (!imageFile) return toast.error("Please select a cover image.");
    if (selectedChapterIds.length === 0) return toast.error("Please select at least one chapter.");

    setIsSubmitting(true);

    try {
      // 1. Filter chapters based on selection
      const finalChapters = extractedChapters
        .filter(ch => selectedChapterIds.includes(ch.id))
        .map(ch => ({ title: ch.title, content: ch.paragraphs }));

      // 2. Upload Cover Image
      toast.info("Uploading cover image...");
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName);
      const coverUrl = urlData.publicUrl;

      // 3. Save Story to Database
      toast.info("Saving story to database...");
      const { error: dbError } = await supabase.from('stories').insert({
        title: data.title,
        description: data.description,
        category: data.category,
        price_mwk: data.price_mwk,
        is_locked: data.is_locked,
        content: finalChapters, // Saving as structured JSON!
        cover_image: coverUrl,
      });

      if (dbError) throw dbError;

      toast.success("Story published successfully!");
      router.push("/admin/stories");

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Upload New Story</h1>
          <p className="text-gray-light/60 mt-1 text-sm sm:text-base">Fill in the details and upload your files.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
        
        {/* Basic Info Fields */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-light/80 block">Story Title</label>
          <input {...register("title")} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" placeholder="e.g. Echoes of the Night" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-light/80 block">Description</label>
          <textarea {...register("description")} rows={3} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all resize-none" placeholder="A short summary..." />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Category</label>
            <input {...register("category")} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" placeholder="e.g. Thriller" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-light/80 block">Price (MWK) <span className="text-gray-light/40 font-normal">- 0 for Free</span></label>
            <input type="number" {...register("price_mwk", { valueAsNumber: true })} className="w-full glass border border-white/10 rounded-xl py-3.5 px-4 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all" placeholder="0" />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 shadow-sm">
          <div>
            <p className="text-base font-semibold text-white">Premium Story?</p>
            <p className="text-xs text-gray-light/50 mt-0.5">If yes, users must pay to unlock it.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer active:scale-95 transition-transform">
            <input type="checkbox" {...register("is_locked")} className="sr-only peer" />
            <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          </label>
        </div>

        {/* DOCX Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-light/80 block">Story Content (.docx)</label>
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

        {/* Chapter Selection UI */}
        {extractedChapters.length > 0 && (
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

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-light/80 block">Cover Image</label>
          <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.98]">
            <Upload size={18} className="text-gray-light/60" />
            <span className="text-sm text-gray-light/80 font-medium truncate max-w-[200px]">
              {imageFile ? imageFile.name : "Choose Cover Image"}
            </span>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden" 
            />
          </label>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full py-4 text-base font-semibold shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-transform" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={20} /> Publishing...</>
          ) : (
            <><Upload size={20} /> Publish Story</>
          )}
        </Button>
      </form>
    </div>
  );
}