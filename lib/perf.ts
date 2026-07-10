const enablePerfLogs = process.env.ENABLE_PERF_LOGS === "true";

export function perfStart() {
  return enablePerfLogs ? Date.now() : 0;
}

export function logPerf(label: string, startedAt: number) {
  if (!enablePerfLogs) {
    return;
  }

  console.log(`[perf] ${label} took ${Date.now() - startedAt}ms`);
}

export async function timeAsync<T>(
  label: string,
  task: () => PromiseLike<T> | T
): Promise<T> {
  if (!enablePerfLogs) {
    return task();
  }

  const startedAt = Date.now();

  try {
    return await task();
  } finally {
    console.log(`[perf] ${label} took ${Date.now() - startedAt}ms`);
  }
}

type SupabaseErrorDetails = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
};

/** Logs the safe diagnostic fields returned by Supabase without logging row data. */
export function logSupabaseError(label: string, error: SupabaseErrorDetails | null) {
  if (!error) {
    return;
  }

  console.error(`[${label}]`, {
    code: typeof error.code === "string" ? error.code : null,
    details: typeof error.details === "string" ? error.details : null,
    hint: typeof error.hint === "string" ? error.hint : null,
    message: typeof error.message === "string" ? error.message : null
  });
}
