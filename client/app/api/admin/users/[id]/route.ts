import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { name, shopName, role, phone, userType } = await req.json();
    const { id } = await params;

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