import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const whitelistSetting = await prisma.systemSetting.findUnique({ where: { key: "WHITELIST_ENABLED" } });
    const joinCodesSetting = await prisma.systemSetting.findUnique({ where: { key: "JOIN_CODES" } });
    const whitelistedNumbersSetting = await prisma.systemSetting.findUnique({ where: { key: "WHITELISTED_NUMBERS" } });

    return NextResponse.json({
      whitelistEnabled: whitelistSetting?.value === "true",
      joinCodes: joinCodesSetting?.value || "",
      whitelistedNumbers: whitelistedNumbersSetting?.value || "",
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

    // Upsert settings
    await prisma.systemSetting.upsert({
      where: { key: "WHITELIST_ENABLED" },
      update: { value: String(whitelistEnabled) },
      create: { key: "WHITELIST_ENABLED", value: String(whitelistEnabled) },
    });

    await prisma.systemSetting.upsert({
      where: { key: "JOIN_CODES" },
      update: { value: joinCodes },
      create: { key: "JOIN_CODES", value: joinCodes },
    });

    await prisma.systemSetting.upsert({
      where: { key: "WHITELISTED_NUMBERS" },
      update: { value: whitelistedNumbers },
      create: { key: "WHITELISTED_NUMBERS", value: whitelistedNumbers },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
