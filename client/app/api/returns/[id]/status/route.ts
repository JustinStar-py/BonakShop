// FILE: app/api/admin/returns/[id]/status/route.ts
// API for admins to update the status of a return request.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returnRequestId = params.id;
    const { status } = await req.json(); // Expecting status: 'APPROVED' | 'REJECTED'

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status provided" }, { status: 400 });
    }

    const updatedReturnRequest = await prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: { status: status },
    });

    return NextResponse.json(updatedReturnRequest, { status: 200 });

  } catch (error) {
    console.error("Return status update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}