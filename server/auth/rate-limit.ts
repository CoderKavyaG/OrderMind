interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

/**
 * Generic in-memory rate limiter.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const maxAttempts = options.maxAttempts ?? 10;
  const windowMs = options.windowMs ?? 60000;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count, resetAt: record.resetAt };
}

/**
 * Checks in-memory rate limit specifically for login attempts.
 * Max 5 attempts per window (60 seconds).
 */
export function checkLoginRateLimit(key: string, maxAttempts = 5, windowMs = 60000): { allowed: boolean; remaining: number } {
  const res = checkRateLimit(`login:${key}`, { maxAttempts, windowMs });
  return { allowed: res.allowed, remaining: res.remaining };
}

export function resetLoginRateLimit(key: string): void {
  rateLimitStore.delete(`login:${key}`);
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

