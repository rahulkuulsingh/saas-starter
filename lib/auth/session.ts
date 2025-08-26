import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SessionUser } from '@/lib/db/schema';  // Import SessionUser instead of User
import bcrypt from 'bcryptjs';

const secretKey = process.env.AUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

// Update the SessionData type
export type SessionData = {
  user: SessionUser;  // Changed from User to SessionUser
  expires: string;
};

export async function encrypt(payload: SessionData) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionData;
  } catch (error) {
    console.log('Failed to verify session');
  }
}

// Update setSession to accept SessionUser
export async function setSession(user: SessionUser) {  // Changed parameter type
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user,
    expires: expiresAt.toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set('session', await encrypt(session), {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const decoded = await decrypt(token);
    return decoded || null;
  } catch (error) {
    return null;
  }
}

// Password utility functions
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
