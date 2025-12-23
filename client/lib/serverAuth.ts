import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

type RefreshTokenPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export async function getUserFromRefreshToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) return null;

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as RefreshTokenPayload;

    if (!payload?.userId) return null;

    return await prisma.user.findUnique({ where: { id: payload.userId } });
  } catch {
    return null;
  }
}
