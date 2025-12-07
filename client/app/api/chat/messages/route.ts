import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, content } = await req.json();

    if (!sessionId || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Access check
    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'WORKER' && session.userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.status === 'CLOSED') {
        return NextResponse.json({ error: "Chat is closed" }, { status: 400 });
    }

    // Rate limit: Check last message from this user
    const lastMessage = await prisma.chatMessage.findFirst({
        where: {
            senderId: auth.user.id,
            sessionId: sessionId
        },
        orderBy: { createdAt: 'desc' }
    });

    if (lastMessage) {
        const timeDiff = new Date().getTime() - lastMessage.createdAt.getTime();
        if (timeDiff < 1000) { // 1 second limit
            return NextResponse.json({ error: "لطفا کمی صبر کنید" }, { status: 429 });
        }
    }

    const message = await prisma.chatMessage.create({
        data: {
            sessionId,
            senderId: auth.user.id,
            content
        },
        include: {
            sender: { select: { id: true, name: true, role: true } }
        }
    });
    
    // Update session timestamp so it moves to top
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
