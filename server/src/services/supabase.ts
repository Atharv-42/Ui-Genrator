import { createClient } from "@supabase/supabase-js";
function required(name: string) { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured.`); return value; }
export function supabaseAdmin() {
  return createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function requireUser(authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Authentication is required.");
  const client = createClient(required("SUPABASE_URL"), required("SUPABASE_ANON_KEY"), { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("Your session is invalid or expired.");
  return data.user;
}
