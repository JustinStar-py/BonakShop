import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const sessions = await prisma.chatSession.findMany({
      where: { userId: auth.user.id },
      include: {
        messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
        },
        _count: {
            select: {
                messages: {
                    where: {
                        read: false,
                        senderId: { not: auth.user.id } // Unread messages from others (admin)
                    }
                }
            }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Chat sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check limit: 3 sessions per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.chatSession.count({
        where: {
            userId: auth.user.id,
            createdAt: { gte: startOfDay }
        }
    });

    if (count >= 3) {
        return NextResponse.json({ error: "محدودیت روزانه: شما می‌توانید روزانه حداکثر ۳ گفت و گو ایجاد کنید." }, { status: 429 });
    }

    const session = await prisma.chatSession.create({
        data: {
            userId: auth.user.id,
            status: 'OPEN'
        }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Create chat session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
