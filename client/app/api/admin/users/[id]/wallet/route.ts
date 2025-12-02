import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { amount } = await req.json();
    const { id } = await Promise.resolve(params);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update balance
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    return NextResponse.json({
      ...updatedUser,
      balance: updatedUser.balance ? updatedUser.balance.toString() : "0",
    });
  } catch (error) {
    console.error("Error charging wallet:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
