// src/store/useReadingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadingState {
  lastStoryId: string | null;
  lastChapterIndex: number;
  setLastRead: (storyId: string, chapterIndex: number) => void;
  clearLastRead: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      lastStoryId: null,
      lastChapterIndex: 0,
      setLastRead: (storyId, chapterIndex) => set({ lastStoryId: storyId, lastChapterIndex: chapterIndex }),
      clearLastRead: () => set({ lastStoryId: null, lastChapterIndex: 0 }),
    }),
    { name: 'msarchive-reading-progress' }
  )
);