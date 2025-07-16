// FILE: app/api/auth/register/route.ts (Updated with Password Length Validation)
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
    const { phone, password, confirmPassword } = body;

    if (!phone || !password || !confirmPassword) {
      return NextResponse.json({ error: "تمام فیلدها الزامی هستند." }, { status: 400 });
    }

    // ADDED: Check for minimum password length
    if (password.length < 6) {
      return NextResponse.json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد." }, { status: 400 });
    }

    if (password !== confirmPassword) {
        return NextResponse.json({ error: "رمزهای عبور با یکدیگر مطابقت ندارند." }, { status: 400 });
    }
    
    const normalizedPhone = normalizePhoneNumber(phone);
    
    if (normalizedPhone.length !== 11) {
        return NextResponse.json({ error: "فرمت شماره تلفن صحیح نیست." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json({ error: "این شماره تلفن قبلاً ثبت‌نام کرده است." }, { status: 409 });
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
    return NextResponse.json({ error: "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید." }, { status: 500 });
  }
}