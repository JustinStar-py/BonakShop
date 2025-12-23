// FILE: middleware.ts
// DESCRIPTION: Optimized middleware with better performance

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { redis } from '@/lib/redis';

type CachedToken = { userId: string; expiry: number };

const tokenCachePrefix = 'jwt:token:';

const hashToken = async (token: string): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) return token;
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const getTokenCacheKey = async (token: string): Promise<string> =>
  `${tokenCachePrefix}${await hashToken(token)}`;

const getCachedToken = async (token: string): Promise<CachedToken | null> => {
  try {
    const key = await getTokenCacheKey(token);
    const cached = await redis.get<string>(key);
    if (!cached) return null;
    return JSON.parse(cached) as CachedToken;
  } catch {
    return null;
  }
};

const setCachedToken = async (token: string, data: CachedToken): Promise<void> => {
  const ttlSeconds = Math.max(0, Math.floor((data.expiry - Date.now()) / 1000));
  if (ttlSeconds <= 0) return;
  try {
    const key = await getTokenCacheKey(token);
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch {
    // Best-effort cache write
  }
};

const deleteCachedToken = async (token: string): Promise<void> => {
  try {
    const key = await getTokenCacheKey(token);
    await redis.del(key);
  } catch {
    // Best-effort cache delete
  }
};

export async function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication failed: No token provided.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  // Check cache first (reduces verification overhead)
  const cached = await getCachedToken(token);
  if (cached && Date.now() < cached.expiry) {
    // Token is valid and cached
    const response = NextResponse.next();
    response.headers.set('x-user-id', cached.userId);
    return response;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const verified = await jwtVerify(token, secret);

    // Cache the verified token
    if (verified.payload.userId && verified.payload.exp) {
      await setCachedToken(token, {
        userId: verified.payload.userId as string,
        expiry: (verified.payload.exp as number) * 1000
      });
    }

    const response = NextResponse.next();
    if (verified.payload.userId) {
      response.headers.set('x-user-id', verified.payload.userId as string);
    }

    return response;
  } catch (err) {
    // JWT verification failed - do NOT log token data for security

    // Remove from cache if verification fails
    await deleteCachedToken(token);

    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication failed: Invalid token.' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: [
    '/api/((?!auth|products|categories).*)',
    '/api/user/:path*',
    '/api/orders/:path*',
    '/api/admin/:path*',
  ],
};
