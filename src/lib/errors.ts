/** Errors shown to students are always human-readable. Raw database/SDK messages go to the console only. */
export class AppError extends Error {
  readonly kind: "network" | "notfound" | "config" | "server";
  constructor(kind: AppError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

const NETWORK_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|aborted/i;

export function isNetworkError(e: unknown): boolean {
  if (e instanceof AppError) return e.kind === "network";
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "";
  return NETWORK_RE.test(msg) || (typeof navigator !== "undefined" && navigator.onLine === false);
}

/** Convert anything thrown by supabase-js / fetch into an AppError with a safe message. */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  console.error("[ranga]", e);
  if (isNetworkError(e)) return new AppError("network", "Can't reach the server. Check your connection and try again.");
  return new AppError("server", "Something went wrong on our side. Please try again in a moment.");
}

export function friendlyMessage(e: unknown): string {
  return toAppError(e).message;
}
