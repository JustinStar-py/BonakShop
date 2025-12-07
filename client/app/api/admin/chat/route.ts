import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth || (auth.user.role !== 'ADMIN' && auth.user.role !== 'WORKER')) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'OPEN' or 'CLOSED' filter
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [sessions, total] = await prisma.$transaction([
        prisma.chatSession.findMany({
            where,
            include: {
                user: {
                    select: { name: true, shopName: true, phone: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                read: false,
                                senderId: { not: auth.user.id } // Unread messages
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.chatSession.count({ where })
    ]);

    return NextResponse.json({
        sessions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    console.error("Admin chat sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
