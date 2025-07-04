// FILE: app/api/admin/returns/route.ts
// API for admins to fetch all return requests.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returnRequests = await prisma.returnRequest.findMany({
      include: {
        order: {
          include: {
            user: {
              select: { name: true, shopName: true }
            }
          }
        },
        items: {
          include: {
            orderItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(returnRequests, { status: 200 });

  } catch (error) {
    console.error("Failed to fetch return requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}