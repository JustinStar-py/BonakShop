import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cache from "memory-cache";

const normalizePhoneNumber = (phone: string): string => {
  if (phone.startsWith("+98")) return "0" + phone.substring(3);
  if (!phone.startsWith("0")) return "0" + phone;
  return phone;
};

const SMS_API_BASE = "https://api.fast-creat.ir/sms";
const SMS_TEMPLATE = process.env.SMS_TEMPLATE_ID || "login";
const SMS_API_KEY = process.env.SMS_API_KEY || process.env.SMS_APIKEY || "";
const MAX_PER_HOUR = 5;
const MIN_INTERVAL_MS = 60 * 1000; // 1 minute between sends

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "شماره تلفن الزامی است." }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    // اجازه می‌دهیم کاربر جدید هم کد بگیرد؛ ایجاد/ورود در verify-otp انجام می‌شود.

    // Fetch Whitelisted Numbers from DB
    const whitelistSetting = await prisma.systemSetting.findUnique({
      where: { key: "WHITELISTED_NUMBERS" },
    });

    const WHITELISTED_NUMBERS = whitelistSetting?.value
      ? whitelistSetting.value.split(",").map((n) => n.trim())
      : [];
    
    if (WHITELISTED_NUMBERS.includes(normalizedPhone)) {
      return NextResponse.json({ message: "کد ورود ارسال شد." });
    }

    const now = Date.now();
    const hourKey = `otp:count:${normalizedPhone}`;
    const lastKey = `otp:last:${normalizedPhone}`;
    const currentCount = (cache.get(hourKey) as number | null) || 0;
    const lastSent = (cache.get(lastKey) as number | null) || 0;

    if (now - lastSent < MIN_INTERVAL_MS) {
      return NextResponse.json({ error: "لطفاً کمی صبر کنید و دوباره تلاش کنید." }, { status: 429 });
    }
    if (currentCount >= MAX_PER_HOUR) {
      return NextResponse.json({ error: "تعداد درخواست‌های کد برای این شماره زیاد است. بعداً تلاش کنید." }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    cache.put(`otp:${normalizedPhone}`, code, 2 * 60 * 1000); // 2 minutes
    cache.put(hourKey, currentCount + 1, 60 * 60 * 1000); // expire in 1 hour
    cache.put(lastKey, now, MIN_INTERVAL_MS);

    if (!SMS_API_KEY) {
      console.warn("SMS API key missing. Skipping SMS send.");
      return NextResponse.json({ message: "کد ارسال شد (حالت تست)." });
    }

    const url = new URL(SMS_API_BASE);
    url.searchParams.set("apikey", SMS_API_KEY);
    url.searchParams.set("type", "private");
    url.searchParams.set("code", code);
    url.searchParams.set("phone", normalizedPhone);
    url.searchParams.set("template", SMS_TEMPLATE);

    const smsRes = await fetch(url.toString(), { method: "GET" });
    const data = await smsRes.json().catch(() => ({}));

    if (!smsRes.ok || data?.ok === false) {
      console.error("SMS send failed", data);
      return NextResponse.json({ error: "ارسال پیامک با خطا مواجه شد." }, { status: 500 });
    }

    return NextResponse.json({ message: "کد ورود ارسال شد." });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
