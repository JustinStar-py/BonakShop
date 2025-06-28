// FILE: app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

const normalizePhoneNumber = (phone: string): string => {
    if (phone.startsWith("+98")) return "0" + phone.substring(3);
    if (!phone.startsWith("0")) return "0" + phone;
    return phone;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // 1. Find the user by phone number
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 2. Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. If credentials are valid, create a session
    const session = await getSession();
    session.isLoggedIn = true;
    session.user = user;
    await session.save(); // Save the session to a cookie

    // 4. Return the user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}