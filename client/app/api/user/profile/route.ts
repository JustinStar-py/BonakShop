// FILE: app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PUT(req: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, shopName, shopAddress, landline } = body;

    if (!name || !shopName || !shopAddress) {
      return NextResponse.json(
        { error: "Name, shop name, and address are required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name,
        shopName,
        shopAddress,
        landline,
      },
    });

    session.user = updatedUser;
    await session.save();

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}