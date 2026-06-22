// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

// This special client automatically syncs your login session to HTTP cookies!
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);