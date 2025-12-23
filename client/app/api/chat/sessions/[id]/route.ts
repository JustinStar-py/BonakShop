import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 100);
    const cursor = searchParams.get('cursor');
    const direction = searchParams.get('direction') || 'back'; // 'back' (history) or 'forward' (updates)

    const messagesArgs: Prisma.ChatMessageFindManyArgs = {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, role: true } } }
    };

    if (cursor) {
        messagesArgs.cursor = { id: cursor };
        messagesArgs.skip = 1;
        if (direction === 'forward') {
            messagesArgs.take = limit;
        } else {
            messagesArgs.take = -limit;
        }
    } else {
        messagesArgs.take = -limit;
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: messagesArgs,
        user: { select: { name: true, phone: true } }
      }
    });

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Access check
    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'WORKER' && session.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark all unread messages from other party as read (optimized)
    await prisma.chatMessage.updateMany({
        where: {
            sessionId: sessionId,
            senderId: { not: auth.user.id },
            read: false
        },
        data: { read: true }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: sessionId } = await params;
    const { status } = await req.json(); // Expecting 'CLOSED' (or 'OPEN' if admin re-opens)

    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Access check
    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'WORKER' && session.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // User can only CLOSE, not Re-open
    if (auth.user.role === 'CUSTOMER' && status === 'OPEN') {
         return NextResponse.json({ error: "Only admins can re-open chats" }, { status: 403 });
    }

    const updatedSession = await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
