// FILE: app/api/auth/register/route.ts (Corrected)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma"; // IMPORTANT: Import the shared prisma instance

// IMPORTANT: Ensure there is NO `const prisma = new PrismaClient()` in this file.

const normalizePhoneNumber = (phone: string): string => {
  if (phone.startsWith("+98")) return "0" + phone.substring(3);
  if (!phone.startsWith("0")) return "0" + phone;
  return phone;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required" }, { status: 400 });
    }
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    if (normalizedPhone.length !== 11) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
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