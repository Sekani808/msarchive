// src/app/admin/stories/new/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Check, X } from "lucide-react";
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
  });

  // Function to extract chapters from DOCX
    // Function to extract chapters from DOCX
    // Function to extract chapters from DOCX
  // 2. Parse new DOCX if uploaded
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
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div>
        <h1 className="text-3xl font-bold text-white">Upload New Story</h1>
        <p className="text-gray-light/60 mt-1">Fill in the details and upload your files.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-6">
        
        {/* Basic Info Fields */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Story Title</label>
          <input {...register("title")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="e.g. Echoes of the Night" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Description</label>
          <textarea {...register("description")} rows={3} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none" placeholder="A short summary..." />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Category</label>
            <input {...register("category")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="e.g. Thriller" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Price (MWK) - 0 for Free</label>
            <input type="number" {...register("price_mwk")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="0" />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-navy-dark/50 rounded-xl border border-white/5">
          <div>
            <p className="text-sm font-bold text-white">Premium Story?</p>
            <p className="text-xs text-gray-light/50">If yes, users must pay to unlock it.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("is_locked")} className="sr-only peer" />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
          </label>
        </div>

        {/* DOCX Upload */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Story Content (.docx)</label>
          <input 
            type="file" 
            accept=".docx"
            onChange={handleDocxChange}
            className="block w-full text-sm text-gray-light/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand hover:file:bg-brand/30 cursor-pointer"
          />
          {isParsing && <p className="text-xs text-brand mt-2 animate-pulse">Parsing document for chapters...</p>}
        </div>

        {/* Chapter Selection UI */}
        {extractedChapters.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-light/80 block">Select Chapters to Publish ({selectedChapterIds.length}/{extractedChapters.length})</label>
            <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-navy-dark/30 rounded-xl border border-white/5">
              {extractedChapters.map((chapter, index) => {
                const isSelected = selectedChapterIds.includes(chapter.id);
                return (
                  <div 
                    key={`${chapter.id}-${index}`}
                    onClick={() => toggleChapter(chapter.id)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-brand/10 border border-brand/30" : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <span className="text-sm text-white font-medium">{chapter.title}</span>
                    {isSelected ? <Check size={16} className="text-brand" /> : <X size={16} className="text-gray-light/30" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Cover Image</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-light/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue/20 file:text-accent-blue hover:file:bg-accent-blue/30 cursor-pointer"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="animate-spin" size={18} /> Publishing...</>
          ) : (
            <><Upload size={18} /> Publish Story</>
          )}
        </Button>
      </form>
    </div>
  );
}