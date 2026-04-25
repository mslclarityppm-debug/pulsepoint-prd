// In-memory rate limiting for authentication attempts
// Resets on server restart - suitable for small applications

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
}> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First attempt or window expired
    const resetTime = now + WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
      resetTime,
    };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
    resetTime: entry.resetTime,
  };
}

export async function resetRateLimit(identifier: string): Promise<void> {
  rateLimitStore.delete(identifier);
}

// Clean up expired entries periodically (optional, for memory management)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute