// FILE: lib/session.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { User } from '@prisma/client';

// Define the shape of the session data
export interface SessionData {
  isLoggedIn: boolean;
  user: User;
}

// Define session options with a 30-day lifespan
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'bonakshop-session',
  ttl: 60 * 24 * 60 * 60, // Time To Live: 30 days in seconds
  cookieOptions: {
    // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    secure: false, // For development on localhost (http)
  },
};

// Helper function to get the current session from the request cookies
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}