// FILE: app/api/distributors/[id]/route.ts (NEW FILE)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

// Handles UPDATING an existing distributor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const { id: distributorId } = await params;
    const { name, logo } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Distributor name is required" }, { status: 400 });
    }

    const updatedDistributor = await prisma.distributor.update({
      where: { id: distributorId },
      data: { name, logo },
    });
    
    revalidateTag("distributors");
    return NextResponse.json(updatedDistributor, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "پخش‌کننده مورد نظر برای ویرایش یافت نشد." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update distributor" }, { status: 500 });
  }
}

// Handles DELETING an existing distributor
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: distributorId } = await params;

    await prisma.distributor.delete({ where: { id: distributorId } });
    
    revalidateTag("distributors");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "پخش‌کننده مورد نظر برای حذف یافت نشد." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return NextResponse.json({ error: "امکان حذف این پخش‌کننده وجود ندارد زیرا محصولاتی به آن متصل هستند." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to delete distributor" }, { status: 500 });
  }
}