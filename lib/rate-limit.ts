// In-memory rate limiting for authentication attempts.
// Uses a Map with periodic cleanup. For multi-instance deployments,
// replace with Redis or a shared store.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const REGISTRATION_MAX_ATTEMPTS = 3;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;

const API_MAX_ATTEMPTS = 60;
const API_WINDOW_MS = 60 * 1000;

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS,
): Promise<{
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
}> {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime,
    };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

export async function checkRegistrationRateLimit(identifier: string) {
  return checkRateLimit(identifier, REGISTRATION_MAX_ATTEMPTS, REGISTRATION_WINDOW_MS);
}

export async function checkApiRateLimit(identifier: string) {
  return checkRateLimit(identifier, API_MAX_ATTEMPTS, API_WINDOW_MS);
}

export async function resetRateLimit(identifier: string): Promise<void> {
  rateLimitStore.delete(identifier);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);
