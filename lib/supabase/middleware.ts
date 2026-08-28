import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  isSupabaseConfigured,
  requireSupabaseEnv
} from "@/lib/supabase/env";

const sessionRefreshTimeoutMs = 4_000;

class SessionRefreshTimeoutError extends Error {
  constructor() {
    super(
      `Supabase session refresh exceeded ${sessionRefreshTimeoutMs}ms in middleware.`
    );
    this.name = "SessionRefreshTimeoutError";
  }
}

async function refreshSessionWithTimeout(
  supabase: ReturnType<typeof createServerClient<Database>>
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      supabase.auth.getClaims(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new SessionRefreshTimeoutError()),
          sessionRefreshTimeoutMs
        );
      })
    ]);
  } catch (error) {
    console.warn("[Supabase middleware] Session refresh skipped.", error);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

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
  await refreshSessionWithTimeout(supabase);

  return response;
}
