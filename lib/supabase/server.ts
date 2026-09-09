import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabaseEnv } from "@/lib/supabase/env";

// Reuse one client within a server render, never across users or requests.
export const createClient = cache(async function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();
  const setAllCookies: SetAllCookies = (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)
      );
    } catch {
      // Server Components cannot always write cookies; middleware refreshes auth.
    }
  };

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll: setAllCookies
    }
  });
});
