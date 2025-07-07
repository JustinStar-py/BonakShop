// FILE: api/returns/route.ts
// Handles creation of new return requests by users.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason, items } = body; // items: [{ orderItemId: string, quantity: number }]

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required return data" }, { status: 400 });
    }
    
    const existingReturn = await prisma.returnRequest.findUnique({
        where: { orderId }
    });
    if(existingReturn) {
        return NextResponse.json({ error: "A return request already exists for this order." }, { status: 409 });
    }

    const newReturnRequest = await prisma.returnRequest.create({
      data: {
        orderId: orderId,
        reason: reason,
        items: {
          create: items.map((item: { orderItemId: string; quantity: number }) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(newReturnRequest, { status: 201 });
  } catch (error) {
    console.error("Failed to create return request:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}