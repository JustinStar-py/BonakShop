import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { name, shopName, role, phone, userType } = await req.json();
    // params is async in nextjs 15, so use params directly if types permit or await params in newer versions.
    // But here 'params' is an object passed to context. In file-system routing, dynamic routes pass params.
    // However, for cleaner handling in API routes:
    
    // Next 15 change: params is a promise? No, in older versions it was object.
    // Let's safely access params.id
    const { id } = await Promise.resolve(params);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, shopName, role, phone, userType },
    });
    return NextResponse.json({
      ...updatedUser,
      balance: updatedUser.balance ? updatedUser.balance.toString() : "0",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
