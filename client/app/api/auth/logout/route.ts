// FILE: app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // With JWT-based auth, the server cannot reliably invalidate stateless tokens
    // Clients should remove tokens on logout. Return success for the client to clear its tokens.
    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}