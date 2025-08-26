'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, type NewUser, type SessionUser } from '@/lib/db/schema';
import { getUserWithPassword, getUserWithPasswordById } from '@/lib/db/queries';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { validatedAction, validatedActionWithUser, type ActionState } from '@/lib/auth/middleware';

// Sign In Action
const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (
  data: z.infer<typeof signInSchema>, 
  formData: FormData
): Promise<ActionState> => {
  const { email, password } = data;

  const user = await getUserWithPassword(email);

  if (!user) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  await setSession(sessionUser);
  redirect('/dashboard');
});

// Sign Up Action
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

export const signUp = validatedAction(signUpSchema, async (
  data: z.infer<typeof signUpSchema>, 
  formData: FormData
): Promise<ActionState> => {
  const { email, password, name } = data;

  const existingUser = await getUserWithPassword(email);

  if (existingUser) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    name,
    role: 'customer',
  };

  const createdUsers = await db.insert(users).values(newUser).returning({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  });

  const createdUser = createdUsers[0];

  if (!createdUser) {
    return { error: 'Failed to create account. Please try again.' };
  }

  await setSession(createdUser);
  redirect('/dashboard');
});

// Sign Out Action
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/sign-in');
}

// Update Account Action
const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (
    data: z.infer<typeof updateAccountSchema>, 
    formData: FormData, 
    user: SessionUser
  ): Promise<ActionState> => {
    const { name, email } = data;

    await db
      .update(users)
      .set({
        name,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: 'Account updated successfully.' };
  }
);

// Update Password Action
const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (
    data: z.infer<typeof updatePasswordSchema>, 
    formData: FormData, 
    user: SessionUser
  ): Promise<ActionState> => {
    const { currentPassword, newPassword } = data;

    const fullUser = await getUserWithPasswordById(user.id);
    if (!fullUser) {
      return { error: 'User not found.' };
    }

    const isCurrentPasswordValid = await comparePasswords(
      currentPassword,
      fullUser.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return { error: 'Current password is incorrect.' };
    }

    if (currentPassword === newPassword) {
      return {
        error: 'New password must be different from your current password.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: 'Password updated successfully.' };
  }
);

// Delete Account Action
const deleteAccountSchema = z.object({
  password: z.string().min(8, 'Password is required'),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (
    data: z.infer<typeof deleteAccountSchema>, 
    formData: FormData, 
    user: SessionUser
  ): Promise<ActionState> => {
    const { password } = data;

    const fullUser = await getUserWithPasswordById(user.id);
    if (!fullUser) {
      return { error: 'User not found.' };
    }

    const isPasswordValid = await comparePasswords(password, fullUser.passwordHash);
    if (!isPasswordValid) {
      return { error: 'Incorrect password. Account not deleted.' };
    }

    await db.delete(users).where(eq(users.id, user.id));

    const cookieStore = await cookies();
    cookieStore.delete('session');
    redirect('/sign-in');
  }
);
