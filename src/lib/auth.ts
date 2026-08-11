import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export function getSavedUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("msarchive_saved_username");
}

export function getSavedEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("msarchive_saved_email");
}

export function saveUserCredentials(username: string, email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("msarchive_saved_username", username);
  localStorage.setItem("msarchive_saved_email", email);
}

export function saveEmail(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("msarchive_saved_email", email);
}

export function saveUsername(username: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("msarchive_saved_username", username);
}
