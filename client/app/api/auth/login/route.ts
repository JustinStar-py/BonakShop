// FILE: app/api/auth/login/route.ts
// DESCRIPTION: Handles user login. Authenticates credentials, generates JWTs (Access and Refresh tokens),
// and creates a server-side session for web clients.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Import the jsonwebtoken library
import prisma from "@/lib/prisma";

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
      { expiresIn: '30d' } // Expires in 30 days
    );

    // 5. Create a long-lived Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '30d' } // Expires in 30 days
    );
    // --- END: JWT Generation ---

    // Remove password before returning the user object
    const { password: _password, ...userWithoutPassword } = user;
    void _password;

    // 6. Set the Refresh Token in a specific HTTP-only cookie
    const response = NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    }, { status: 200 });

    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict' if on the same domain
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return response;

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید." }, { status: 500 });
  }
}
