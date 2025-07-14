// FILE: app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET all suppliers
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany();
    return NextResponse.json(suppliers, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

// POST a new supplier (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, logo } = body;

    if (!name) {
        return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
    }

    const newSupplier = await prisma.supplier.create({
        data: { name, logo }
    });
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}