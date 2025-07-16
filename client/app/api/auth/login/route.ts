// FILE: app/api/auth/login/route.ts (Corrected with Persian Errors)
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
      return NextResponse.json({ error: "شماره تلفن و رمز عبور الزامی است." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      return NextResponse.json({ error: "شماره تلفن یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: "شماره تلفن یا رمز عبور اشتباه است." }, { status: 401 });
    }

    const session = await getSession();
    session.isLoggedIn = true;
    session.user = user;
    await session.save();

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید." }, { status: 500 });
  }
}