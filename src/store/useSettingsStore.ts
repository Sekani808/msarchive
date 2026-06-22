// src/store/useSettingsStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Settings {
  id: string;
  whatsapp_number: string;
  admin_email: string;
  payment_instructions: string;
}

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,
  fetchSettings: async () => {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (data && !error) {
      set({ settings: data, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));