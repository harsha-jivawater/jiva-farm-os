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
