// FILE: client/middleware.ts
// DESCRIPTION: Intercepts incoming requests to protected API routes to validate JWT access tokens.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // A modern, secure library for JWT handling

/**
 * This middleware function is triggered for all routes matching the `matcher` config.
 * It checks for a valid JWT in the 'Authorization' header.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {NextResponse} The response to send back, either continuing the chain or denying access.
 */
export async function middleware(request: NextRequest) {
  // 1. Extract the token from the Authorization header (e.g., "Bearer eyJhbGci...")
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  // 2. If no token is found, return an 'Unauthorized' error
  if (!token) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication failed: No token provided.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  try {
    // 3. Get the secret key from environment variables
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

    // 4. Verify the token. If it's invalid or expired, jwtVerify will throw an error.
    // We don't need the payload here, just the verification check.
    await jwtVerify(token, secret);

    // 5. If the token is valid, allow the request to proceed to the API route
    return NextResponse.next();

  } catch (err) {
    console.error("JWT Verification Error:", err);
    // 6. If verification fails, return a 'Forbidden' error
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Authentication failed: Invalid token.' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
}

// --- Configuration ---
/**
 * The `matcher` config specifies which routes this middleware should run on.
 * We are protecting all API routes under /api/user, /api/orders, etc.,
 * while excluding the public authentication routes.
 *
 * It uses a negative lookahead `(?!...)` to exclude specific paths.
 */
export const config = {
  matcher: [
    '/api/((?!auth|products|categories).*)', // Protects all API routes except auth, products, and categories
    '/api/user/:path*',
    '/api/orders/:path*',
    '/api/admin/:path*',
  ],
};