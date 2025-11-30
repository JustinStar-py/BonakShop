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
    const { name, shopName, shopAddress, landline, latitude, longitude, userType } = body;

    if (!name || !shopAddress) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    if (userType === 'SHOP_OWNER' && !shopName) {
      return NextResponse.json(
        { error: "Shop name is required for shop owners" },
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
        latitude,
        longitude,
        userType, // Save userType
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