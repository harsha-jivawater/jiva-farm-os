import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export function GET() {
  const configured = isSupabaseConfigured();

  return NextResponse.json(
    {
      environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
      status: configured ? "ok" : "unavailable"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      },
      status: configured ? 200 : 503
    }
  );
}
