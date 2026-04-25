// CSRF protection using double-submit cookie pattern
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getCSRFToken(): Promise<string> {
  const cookieStore = cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    // This should not happen since middleware sets it
    throw new Error('CSRF token not found');
  }

  return token;
}

export async function validateCSRFToken(formToken: string | null): Promise<boolean> {
  if (!formToken) return false;

  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) return false;

  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, formToken);
}

// Constant-time comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export async function rotateCSRFToken(): Promise<string> {
  // Note: In server actions, cookies can be set
  const cookieStore = cookies();
  const newToken = generateCSRFToken();

  cookieStore.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return newToken;
}