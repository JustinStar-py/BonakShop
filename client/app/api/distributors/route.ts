// FILE: app/api/distributors/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { cacheKeys, getCached, invalidateCache } from "@/lib/redis";

// GET all distributors
export async function GET() {
  try {
    const cacheKey = cacheKeys.distributors.all();
    const distributors = await getCached(
      cacheKey,
      () =>
        prisma.distributor.findMany({
          orderBy: { name: "asc" },
        }),
      3600
    );
    return NextResponse.json(distributors, { status: 200 });
  } catch {
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

    // Invalidate cache
    revalidateTag("distributors", "max");
    await invalidateCache("distributors:*");

    return NextResponse.json(newDistributor, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create distributor" }, { status: 500 });
  }
}
