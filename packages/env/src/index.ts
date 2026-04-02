import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env and .env.local
// Order matters: first ones in the array have priority if override is true, 
// but dotenv by default doesn't override process.env if it's already set.
// Here we specify .env.local first so it takes precedence over .env.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
