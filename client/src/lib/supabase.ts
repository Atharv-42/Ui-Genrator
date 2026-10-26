import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured ? createClient(url, key) : null;
export async function accessToken() { const { data } = await supabase!.auth.getSession(); return data.session?.access_token || ""; }
export type AuthUser = { id: string; email?: string };
