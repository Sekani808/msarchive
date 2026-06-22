// src/store/useUnlockStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnlockState {
  unlockedStoryIds: string[];
  unlockStory: (id: string) => void;
  isUnlocked: (id: string) => boolean;
}

export const useUnlockStore = create<UnlockState>()(
  persist(
    (set, get) => ({
      unlockedStoryIds: [],
      
      // Adds a story ID to the unlocked list
      unlockStory: (id) => set((state) => ({ 
        unlockedStoryIds: [...state.unlockedStoryIds, id] 
      })),
      
      // Checks if a story ID is in the unlocked list
      isUnlocked: (id) => get().unlockedStoryIds.includes(id),
    }),
    { 
      name: 'msarchive-unlocks', // This saves the data to the browser's LocalStorage
    }
  )
);