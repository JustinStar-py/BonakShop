// FILE: middleware.ts
// DESCRIPTION: Optimized middleware with better performance

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Cache for verified tokens (in production, use Redis)
const tokenCache = new Map<string, { userId: string; expiry: number }>();

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
  const cached = tokenCache.get(token);
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
      tokenCache.set(token, {
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
    tokenCache.delete(token);

    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication failed: Invalid token.' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
}

// Cleanup expired tokens every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenCache.entries()) {
      if (now >= data.expiry) {
        tokenCache.delete(token);
      }
    }
  }, 5 * 60 * 1000);
}

export const config = {
  matcher: [
    '/api/((?!auth|products|categories).*)',
    '/api/user/:path*',
    '/api/orders/:path*',
    '/api/admin/:path*',
  ],
};