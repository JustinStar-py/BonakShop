// FILE: app/api/auth/refresh/route.ts
// DESCRIPTION: Handles token refresh requests. Verifies a refresh token and issues a new access token.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Define a type for the decoded refresh token payload for type safety
interface RefreshTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Handles POST requests to /api/auth/refresh.
 * Expects a 'refreshToken' in the httpOnly cookie.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} A response object with a new access token or an error message.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // 1. Check if the refresh token is provided
    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required." }, { status: 401 });
    }

    let decoded: RefreshTokenPayload;

    try {
      // 2. Verify the refresh token using the secret key
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as RefreshTokenPayload;
    } catch (error) {
      // If verification fails (e.g., token is invalid or expired), deny access
      console.error("Invalid refresh token:", error);
      return NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 403 }); // 403 Forbidden
    }

    // 3. Find the user associated with the token from the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      // This could happen if the user was deleted after the token was issued
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 4. Generate a new, short-lived access token
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '30d' } // Keep the expiration consistent with the login API
    );

    // 5. Refresh the cookie to extend its lifespan without changing the token value
    const response = NextResponse.json({ accessToken: newAccessToken }, { status: 200 });
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return response;

  } catch (error) {
    console.error("Refresh token API error:", error);
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
