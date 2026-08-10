// src/types/story.ts
export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  price_mwk: number;
  is_locked: boolean;
  category: string;
  average_rating?: number | null;
  ratings_count?: number | null;
  likes_count?: number;
  is_liked?: boolean;
}