// FILE: app/api/suppliers/[id]/route.ts (NEW FILE)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

// Handles UPDATING an existing supplier
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const { id: supplierId } = await params;
    const { name, logo } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: { name, logo },
    });
    
    revalidateTag("suppliers");
    
    return NextResponse.json(updatedSupplier, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "تولیدکننده مورد نظر برای ویرایش یافت نشد." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

// Handles DELETING an existing supplier
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: supplierId } = await params;

    await prisma.supplier.delete({ where: { id: supplierId } });
    
    revalidateTag("suppliers");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ error: "تولیدکننده مورد نظر برای حذف یافت نشد." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return NextResponse.json({ error: "امکان حذف این تولیدکننده وجود ندارد زیرا محصولاتی به آن متصل هستند." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}