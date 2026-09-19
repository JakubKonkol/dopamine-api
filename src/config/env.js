import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/dopamine-db'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:4200')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  TMDB_API_KEY: z.string().min(1, 'TMDB_API_KEY is required'),
  TMDB_LANGUAGE: z.string().default('en-US'),
  TMDB_REGION: z.string().length(2).default('PL'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
