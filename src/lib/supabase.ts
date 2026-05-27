import { createClient } from "@supabase/supabase-js";

// Santa Monica National High School - SHS Enrollment
export const SUPABASE_URL = "https://lhxrnobpgjmlcvcwexmx.supabase.co";

// PASTE YOUR SUPABASE ANON (PUBLISHABLE) KEY BELOW.
// Get it from: Supabase Dashboard > Project Settings > API > anon public key
export const SUPABASE_ANON_KEY = "REPLACE_WITH_YOUR_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const STAFF_PASSCODE = "ADMIN_08";
