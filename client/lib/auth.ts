import jwt from 'jsonwebtoken';
import prisma from './prisma';
import type { User } from '@prisma/client';

export interface AuthResult {
  user: User;
  payload: any;
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
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as any;
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    return { user, payload };
  } catch (err) {
    return null;
  }
}

export default getAuthUserFromRequest;