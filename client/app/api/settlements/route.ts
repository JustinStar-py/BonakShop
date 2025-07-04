// FILE: app/api/settlements/route.ts
// API route to fetch all available settlement options.
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const settlements = await prisma.settlement.findMany();
    return NextResponse.json(settlements, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch settlements:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}