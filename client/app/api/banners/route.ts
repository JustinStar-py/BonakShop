import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cacheKeys, getCached } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = cacheKeys.banners.active();
    const banners = await getCached(
      cacheKey,
      () =>
        prisma.banner.findMany({
          where: { isActive: true },
          orderBy: { priority: "desc" },
        }),
      600
    );
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
