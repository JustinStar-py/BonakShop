import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { invalidateCache } from "@/lib/redis";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, image, link, isActive, priority } = body;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        image,
        link,
        isActive,
        priority: priority !== undefined ? parseInt(priority) : undefined,
      },
    });
    await invalidateCache("banners:*");
    return NextResponse.json(banner);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    console.error("Error updating banner:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    await invalidateCache("banners:*");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
