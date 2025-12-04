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

    // Fetch System Settings
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["WHITELIST_ENABLED", "JOIN_CODES", "WHITELISTED_NUMBERS"] } },
    });

    const whitelistSetting = settings.find((s) => s.key === "WHITELIST_ENABLED");
    const joinCodesSetting = settings.find((s) => s.key === "JOIN_CODES");
    const whitelistedNumbersSetting = settings.find((s) => s.key === "WHITELISTED_NUMBERS");

    const isWhitelistEnabled = whitelistSetting?.value === "true";
    const joinCodes = joinCodesSetting?.value
      ? joinCodesSetting.value.split(",").map((c) => c.trim())
      : [];
    const WHITELISTED_NUMBERS = whitelistedNumbersSetting?.value
      ? whitelistedNumbersSetting.value.split(",").map((n) => n.trim())
      : [];

    const isTestNumber = WHITELISTED_NUMBERS.includes(normalizedPhone) && normalizedCode === "12345";

    const isStaticCodeValid = joinCodes.includes(normalizedCode);
    let isDynamicCodeValid = false;

    if (!isStaticCodeValid && !isTestNumber) {
      const cachedCode = cache.get(`otp:${normalizedPhone}`) as string | null;
      if (cachedCode && cachedCode === normalizedCode) {
        isDynamicCodeValid = true;
      }
    }

    if (!isStaticCodeValid && !isDynamicCodeValid && !isTestNumber) {
      return NextResponse.json(
        { error: "کد وارد شده نامعتبر یا منقضی است." },
        { status: 401 }
      );
    }

    // Clean up OTP if dynamic was used
    if (isDynamicCodeValid) {
      cache.del(`otp:${normalizedPhone}`);
    }

    let user = await prisma.user.findUnique({ where: { phone: normalizedPhone } });

    if (!user) {
      const randomPass = Math.random().toString(36).slice(-12);
      const hashed = await bcrypt.hash(randomPass, 10);
      
      // Determine approval status for new user
      // If whitelist is OFF -> Approved
      // If whitelist is ON -> Approved ONLY if static code used or test number, otherwise False
      const isApproved = !isWhitelistEnabled || isStaticCodeValid || isTestNumber;

      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          password: hashed,
          role: "CUSTOMER",
          isApproved: isApproved,
        },
      });
    } else {
      // Existing user
      if (isStaticCodeValid || isTestNumber) {
        // If they used a join code or test number, approve them
        if (!user.isApproved) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { isApproved: true },
          });
        }
      } else {
        // Dynamic OTP used
        if (isWhitelistEnabled && !user.isApproved) {
          return NextResponse.json(
            { error: "حساب کاربری شما هنوز تایید نشده است." },
            { status: 403 }
          );
        }
      }
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, phone: user.phone },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "30d" }
    );

    cache.del(`otp:${normalizedPhone}`);

    const { password, ...userWithoutPassword } = user;
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });

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
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
