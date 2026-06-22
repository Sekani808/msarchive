// src/types/story.ts
export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  price_mwk: number;
  is_locked: boolean;
  category: string;
}