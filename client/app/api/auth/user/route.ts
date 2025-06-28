// FILE: app/api/auth/user/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (session.isLoggedIn) {
      return NextResponse.json({ user: session.user });
    }

    return NextResponse.json({ user: null });

  } catch (error) {
    console.error("Get user session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}