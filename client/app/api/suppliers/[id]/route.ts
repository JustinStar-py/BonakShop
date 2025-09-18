// FILE: app/api/suppliers/[id]/route.ts (NEW FILE)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import cache from 'memory-cache';
import { Prisma } from "@prisma/client";

const CACHE_KEY = 'all_suppliers_cache';

// Handles UPDATING an existing supplier
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const supplierId = params.id;
    const { name, logo } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: { name, logo },
    });
    
    cache.del(CACHE_KEY);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const supplierId = params.id;

    await prisma.supplier.delete({ where: { id: supplierId } });
    
    cache.del(CACHE_KEY);

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