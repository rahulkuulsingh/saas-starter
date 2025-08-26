import { z } from 'zod';
import { SessionUser } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any;
};

// Use union type instead of intersection
export type ActionResult<T> = ActionState | T;

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionResult<T>> => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    try {
      return await action(result.data, formData);
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: SessionUser
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData): Promise<ActionResult<T>> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    try {
      return await action(result.data, formData, user);
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };
}

// E-commerce specific middleware functions
type ActionWithUserFunction<T> = (
  formData: FormData,
  user: SessionUser
) => Promise<T>;

export function withUser<T>(action: ActionWithUserFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    return action(formData, user);
  };
}

export function withAdmin<T>(action: ActionWithUserFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');
    }

    if (user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return action(formData, user);
  };
}
