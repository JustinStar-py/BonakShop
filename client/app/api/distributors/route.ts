// FILE: app/api/distributors/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

// GET all distributors
export async function GET() {
  try {
    const distributors = await prisma.distributor.findMany();
    return NextResponse.json(distributors, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch distributors" }, { status: 500 });
  }
}

// POST a new distributor (Admin only)
export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req as Request);
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, logo } = body;

    if (!name) {
        return NextResponse.json({ error: "Distributor name is required" }, { status: 400 });
    }

    const newDistributor = await prisma.distributor.create({
        data: { name, logo }
    });
    return NextResponse.json(newDistributor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create distributor" }, { status: 500 });
  }
}