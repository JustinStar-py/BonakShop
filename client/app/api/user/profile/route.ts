// FILE: app/api/user/profile/route.ts
// Updated to handle optional latitude and longitude
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, shopName, shopAddress, landline, latitude, longitude } = body;

    if (!name || !shopName || !shopAddress) {
      return NextResponse.json(
        { error: "Name, shop name, and address are required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: auth.user.id,
      },
      data: {
        name,
        shopName,
        shopAddress,
        landline,
        latitude,   // Save latitude
        longitude,  // Save longitude
      },
    });


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