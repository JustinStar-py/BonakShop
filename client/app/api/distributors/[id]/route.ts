// FILE: app/api/distributors/[id]/route.ts (NEW FILE)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

// Handles UPDATING an existing distributor
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const distributorId = params.id;
    const { name, logo } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Distributor name is required" }, { status: 400 });
    }

    const updatedDistributor = await prisma.distributor.update({
      where: { id: distributorId },
      data: { name, logo },
    });
    
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const distributorId = params.id;

    await prisma.distributor.delete({ where: { id: distributorId } });
    
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