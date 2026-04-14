import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const ADMIN_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-admin-secret-change-in-prod'
);
const COOKIE_NAME = 'tervix-admin-session';
const EXPIRY = '8h';

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
}

export async function createAdminSession(admin: AdminSession): Promise<string> {
  const token = await new SignJWT(admin)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(ADMIN_SECRET);
  return token;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, ADMIN_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export { COOKIE_NAME };
