import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, image, link, isActive, priority } = body;

    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link,
        isActive: isActive ?? true,
        priority: priority ? parseInt(priority) : 0,
      },
    });
    await invalidateCache("banners:*");
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
