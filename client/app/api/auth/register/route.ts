// FILE: app/api/auth/register/route.ts
// Handles new user registration with password confirmation.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const normalizePhoneNumber = (phone: string): string => {
  if (phone.startsWith("+98")) return "0" + phone.substring(3);
  if (!phone.startsWith("0")) return "0" + phone;
  return phone;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password, confirmPassword } = body; // Added confirmPassword

    if (!phone || !password || !confirmPassword) {
      return NextResponse.json({ error: "Phone and password fields are required" }, { status: 400 });
    }

    if (password !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    if (normalizedPhone.length !== 11) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "A user with this phone number already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}