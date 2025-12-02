import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        shopName: true,
        userType: true,
        balance: true,
        createdAt: true,
      },
    });

    const serializedUsers = users.map(user => ({
      ...user,
      balance: user.balance ? user.balance.toString() : "0",
    }));

    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
