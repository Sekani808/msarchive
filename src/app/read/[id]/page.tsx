// src/app/read/[id]/page.tsx
import Reader from "@/components/reader/Reader";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: story, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !story) notFound();

  // Ensure content is an array of chapter objects
  const chapters = Array.isArray(story.content) ? story.content : [];

  return <Reader storyId={story.id} title={story.title} chapters={chapters} />;
}