import jwt from 'jsonwebtoken';
import prisma from './prisma';
import type { User } from '@prisma/client';

type AccessTokenPayload = jwt.JwtPayload & {
  userId?: string;
  role?: string;
  phone?: string;
};

export interface AuthResult {
  user: User;
  payload: AccessTokenPayload;
}

/**
 * Extract and verify the access token from the request Authorization header.
 * Returns the user and token payload or null if unauthorized.
 */
export async function getAuthUserFromRequest(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;
    if (!payload || typeof payload.userId !== "string") return null;

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    return { user, payload };
  } catch {
    return null;
  }
}

export default getAuthUserFromRequest;
