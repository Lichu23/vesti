type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  limit: number;
  remaining: number;
  resetAt: number;
  success: boolean;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  authRateLimit?: Map<string, RateLimitEntry>;
};

const entries = globalForRateLimit.authRateLimit ?? new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.authRateLimit = entries;
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) {
      entries.delete(key);
    }
  }
}

export function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedAddress = forwardedFor?.split(",", 1)[0]?.trim();

  return forwardedAddress || request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  cleanupExpiredEntries(now);

  const current = entries.get(key);
  const entry = current && current.resetAt > now
    ? current
    : { count: 0, resetAt: now + windowMs };

  entry.count += 1;
  entries.set(key, entry);

  return {
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    success: entry.count <= limit,
  };
}
