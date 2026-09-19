import { z } from 'zod';

export const email = z.string().trim().toLowerCase().email('Enter a valid email address');
export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');
export const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[\w.-]+$/, 'Username may only contain letters, numbers, dots, dashes and underscores');

export const registerSchema = z.object({ email, username, password });
export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });
