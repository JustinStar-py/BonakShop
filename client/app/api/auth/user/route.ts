// FILE: app/api/auth/user/route.ts
// DESCRIPTION: Retrieves the profile of the currently authenticated user based on their JWT.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose"; // A modern, secure library for JWT handling
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

// Define a type for the decoded access token payload for type safety
interface AccessTokenPayload {
  userId: string;
}

/**
 * Handles GET requests to /api/auth/user.
 * Verifies the JWT from the Authorization header and returns the user's data.
 * This route is protected by the middleware.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} A response object with the user's data or an error message.
 */
export async function GET(req: Request) {
  try {
    // 1. Extract the token from the Authorization header.
    // The middleware has already validated the token's existence and signature,
    // but we need to decode it here to get the payload (e.g., userId).
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      // This should technically not be reached if the middleware is configured correctly.
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

    // 2. Verify the token and decode its payload
    const { payload } = await jwtVerify(token, secret);
    const { userId } = payload as unknown as AccessTokenPayload;

    if (!userId) {
        return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // 3. Fetch the user from the database using the ID from the token
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Remove the password from the user object before sending it
    const { password: _, ...userWithoutPassword } = user;

    // 5. Return the user data
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    // Handle database connectivity issues separately for clearer debugging
    if (error instanceof PrismaClientInitializationError) {
      console.error("Get user API error: database unreachable", error.message);
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
    // This catch block will also handle errors from jwtVerify (e.g., expired token)
    console.error("Get user API error:", error);
    return NextResponse.json({ error: "Invalid token or internal server error." }, { status: 500 });
  }
}
