// src/app/admin/stories/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { Save, Loader2, Check, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast, Toaster } from "sonner";
import mammoth from "mammoth";

const storySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  price_mwk: z.coerce.number().min(0, "Price cannot be negative"),
  is_locked: z.boolean().default(false),
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

      let chapters: Chapter[] = [];
      let currentChapter: Chapter | null = null;

      elements.forEach((el: any) => {
        if (el.tagName === 'H1' || el.tagName === 'H2') {
          if (currentChapter && currentChapter.paragraphs.length > 0) chapters.push(currentChapter);
          currentChapter = { id: crypto.randomUUID(), title: el.textContent || 'Untitled', paragraphs: [] };
        } else {
          if (!currentChapter) currentChapter = { id: crypto.randomUUID(), title: 'Prologue', paragraphs: [] };
          if (el.textContent.trim()) currentChapter.paragraphs.push(el.textContent.trim());
        }
      });
      if (currentChapter && currentChapter.paragraphs.length > 0) chapters.push(currentChapter);

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

  if (isLoading) return <div className="p-8 text-gray-light/50">Loading story data...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <Toaster theme="dark" position="top-center" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Story</h1>
          <p className="text-gray-light/60 mt-1">Update details or replace content.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-6">
        
        {/* Current Cover Preview */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Current Cover</label>
          <div className="w-32 h-48 rounded-xl overflow-hidden bg-navy-dark border border-white/10">
            {currentCover ? <img src={currentCover} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-light/30"><ImageIcon /></div>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Story Title</label>
          <input {...register("title")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Description</label>
          <textarea {...register("description")} rows={3} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none" />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Category</label>
            <input {...register("category")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-light/80 mb-2 block">Price (MWK)</label>
            <input type="number" {...register("price_mwk")} className="w-full glass rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-navy-dark/50 rounded-xl border border-white/5">
          <div>
            <p className="text-sm font-bold text-white">Premium Story?</p>
            <p className="text-xs text-gray-light/50">Toggle to lock/unlock.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("is_locked")} className="sr-only peer" />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
          </label>
        </div>

        {/* Replace Cover Image */}
        <div>
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Replace Cover Image (Optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-light/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue/20 file:text-accent-blue cursor-pointer" />
        </div>

        {/* Replace DOCX Content */}
        <div className="pt-4 border-t border-white/5">
          <label className="text-sm font-medium text-gray-light/80 mb-2 block">Replace Story Content (.docx) (Optional)</label>
          <p className="text-xs text-gray-light/40 mb-3">Only upload a new file if you want to change the chapters. Otherwise, leave this blank.</p>
          <input type="file" accept=".docx" onChange={handleDocxChange} className="block w-full text-sm text-gray-light/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand cursor-pointer" />
          {isParsing && <p className="text-xs text-brand mt-2 animate-pulse">Parsing...</p>}
        </div>

        {/* New Chapter Selection */}
        {hasNewDocx && extractedChapters.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-light/80 block">Select Chapters to Publish ({selectedChapterIds.length}/{extractedChapters.length})</label>
            <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-navy-dark/30 rounded-xl border border-white/5">
              {extractedChapters.map((chapter, index) => {
                const isSelected = selectedChapterIds.includes(chapter.id);
                return (
                  <div key={`${chapter.id}-${index}`} onClick={() => toggleChapter(chapter.id)} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-brand/10 border border-brand/30" : "bg-white/5 border border-transparent hover:bg-white/10"}`}>
                    <span className="text-sm text-white font-medium">{chapter.title}</span>
                    {isSelected ? <Check size={16} className="text-brand" /> : <X size={16} className="text-gray-light/30" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : <><Save size={18} /> Save Changes</>}
        </Button>
      </form>
    </div>
  );
}