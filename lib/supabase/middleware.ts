import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  isSupabaseConfigured,
  requireSupabaseEnv
} from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = requireSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(headersToSet).forEach(([name, value]) =>
          response.headers.set(name, value)
        );
      }
    }
  });

  // Refresh before Server Components run so they all receive one valid session.
  await supabase.auth.getClaims();

  return response;
}
