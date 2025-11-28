import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cache from "memory-cache";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const normalizePhoneNumber = (phone: string): string => {
  if (phone.startsWith("+98")) return "0" + phone.substring(3);
  if (!phone.startsWith("0")) return "0" + phone;
  return phone;
};

const normalizeCodeDigits = (code: string): string => {
  const map: Record<string, string> = {
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return code.replace(/[۰-۹]/g, (d) => map[d] ?? d);
};

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "شماره تلفن و کد الزامی است." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedCode = normalizeCodeDigits(String(code));
    const cachedCode = cache.get(`otp:${normalizedPhone}`) as string | null;

    if (!cachedCode || cachedCode !== normalizedCode) {
      return NextResponse.json({ error: "کد وارد شده نامعتبر یا منقضی است." }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      const randomPass = Math.random().toString(36).slice(-12);
      const hashed = await bcrypt.hash(randomPass, 10);
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          password: hashed,
          role: "CUSTOMER",
        },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "60d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "60d" }
    );

    cache.del(`otp:${normalizedPhone}`);

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
