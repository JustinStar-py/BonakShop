import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["WHITELIST_ENABLED", "JOIN_CODES", "WHITELISTED_NUMBERS"] },
      },
    });

    const getVal = (key: string) => settings.find((s) => s.key === key)?.value;

    return NextResponse.json({
      whitelistEnabled: getVal("WHITELIST_ENABLED") === "true",
      joinCodes: getVal("JOIN_CODES") || "",
      whitelistedNumbers: getVal("WHITELISTED_NUMBERS") || "",
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { whitelistEnabled, joinCodes, whitelistedNumbers } = body;

    // Upsert settings in a transaction to use a single connection
    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "WHITELIST_ENABLED" },
        update: { value: String(whitelistEnabled) },
        create: { key: "WHITELIST_ENABLED", value: String(whitelistEnabled) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "JOIN_CODES" },
        update: { value: joinCodes },
        create: { key: "JOIN_CODES", value: joinCodes },
      }),
      prisma.systemSetting.upsert({
        where: { key: "WHITELISTED_NUMBERS" },
        update: { value: whitelistedNumbers },
        create: { key: "WHITELISTED_NUMBERS", value: whitelistedNumbers },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
