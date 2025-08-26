import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { users, SessionUser } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = await verifyToken(sessionCookie.value);
    
    // Fix: Use session.user.id instead of session.userId
    if (!session?.user?.id) {
      return null;
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))  // Fix: Use session.user.id
      .limit(1);

    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getUserById(userId: number): Promise<SessionUser | null> {
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

// New function to get full user with passwordHash (for password operations)
export async function getUserWithPassword(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

export async function getUserWithPasswordById(userId: number) {
  const user = await db
    .select()
    .from(users)  
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}
