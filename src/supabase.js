// ============================================================
// SUPABASE.JS - Supabase client (auth + database)
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Converts a display username to the fake email we store in Supabase
// (Supabase auth requires an email — players only ever see their username)
export function usernameToEmail(username) {
    return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@leifmagscraft.game`;
}
