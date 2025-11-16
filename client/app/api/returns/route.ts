// FILE: app/api/returns/route.ts
// FINAL VERSION: Includes GET to fetch all returns and POST to create them (JWT-based).

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

// GET handler to fetch all return requests for admins/workers
export async function GET(request: Request) {
  try {
    const auth = await getAuthUserFromRequest(request);
    if (!auth || (auth.user.role !== "ADMIN" && auth.user.role !== "WORKER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returnRequests = await prisma.returnRequest.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                shopName: true,
                shopAddress: true,
                phone: true,
              },
            },
          },
        },
        items: {
          include: {
            orderItem: {
              select: { productName: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(returnRequests, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch return requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST handler to create a new return request
export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, items } = body;

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required return data" },
        { status: 400 },
      );
    }

    const existingReturn = await prisma.returnRequest.findUnique({
      where: { orderId },
    });
    if (existingReturn) {
      return NextResponse.json(
        { error: "A return request already exists for this order." },
        { status: 409 },
      );
    }

    const newReturnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        reason,
        status: "REQUESTED",
        items: {
          create: items.map((item: { orderItemId: string; quantity: number }) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(newReturnRequest, { status: 201 });
  } catch (error) {
    console.error("Failed to create return request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}