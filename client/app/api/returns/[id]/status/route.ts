// FILE: api/returns/[id]/status/route.ts
// Handles updating the status of a specific return request.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ReturnStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || (session.user.role !== 'ADMIN' && session.user.role !== 'WORKER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returnId = params.id;
    const { status } = await req.json();

    if (!Object.values(ReturnStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedReturn = await prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: status as ReturnStatus },
    });

    return NextResponse.json(updatedReturn, { status: 200 });
  } catch (error) {
    console.error("Return status update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}