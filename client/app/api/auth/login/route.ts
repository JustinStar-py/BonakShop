// FILE: app/api/auth/login/route.ts
// DESCRIPTION: Handles user login. Authenticates credentials, generates JWTs (Access and Refresh tokens),
// and creates a server-side session for web clients.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Import the jsonwebtoken library
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Normalizes a given phone number to a standard format (e.g., 0912...).
 * @param {string} phone - The phone number to normalize.
 * @returns {string} The normalized phone number.
 */
const normalizePhoneNumber = (phone: string): string => {
    if (phone.startsWith("+98")) return "0" + phone.substring(3);
    if (!phone.startsWith("0")) return "0" + phone;
    return phone;
};

/**
 * Handles POST requests to /api/auth/login.
 * @param {Request} req - The incoming request object.
 * @returns {NextResponse} A response object with user data and tokens or an error message.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    // 1. Validate input
    if (!phone || !password) {
      return NextResponse.json({ error: "شماره تلفن و رمز عبور الزامی است." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // 2. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return NextResponse.json({ error: "شماره تلفن یا رمز عبور اشتباه است." }, { status: 401 });
    }

    // 3. Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "شماره تلفن یا رمز عبور اشتباه است." }, { status: 401 });
    }

    // --- START: JWT Generation ---
    // 4. Create a short-lived Access Token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '60d' } // Expires in 1 hour (adjust as needed)
    );

    // 5. Create a long-lived Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '60d' } // Expires in 30 days (adjust as needed)
    );
    // --- END: JWT Generation ---

    // 6. Create or update the server-side session (for web clients, can be kept for web compatibility)
    const session = await getSession();
    session.isLoggedIn = true;
    session.user = user;
    await session.save();

    // 7. Remove the password from the user object before sending it back
    const { password: _, ...userWithoutPassword } = user;

    // 8. Return user data along with the new tokens
    // The native mobile app will receive this response and store the tokens securely.
    return NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }, { status: 200 });

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید." }, { status: 500 });
  }
}