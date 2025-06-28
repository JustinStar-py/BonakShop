// FILE: app/api/auth/user/route.ts (Corrected)
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    // Check if user is logged in and the user object exists in the session
    if (session.isLoggedIn && session.user) {
      // Return the full user object from the session, which now includes the role
      return NextResponse.json({ user: session.user });
    }
    
    // If not logged in, return null
    return NextResponse.json({ user: null });

  } catch (error) {
    console.error("Get user session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}