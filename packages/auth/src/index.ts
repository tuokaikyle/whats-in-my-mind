import { getDb } from '@whats-in-my-mind/db';
import * as schema from '@whats-in-my-mind/db/schema/auth';
import type { BetterAuthOptions } from 'better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

// Define env type for Cloudflare Workers
export interface AuthEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
}

// Create auth configuration factory that accepts environment variables
export function createAuth(env: AuthEnv) {
  const db = getDb(env.DATABASE_URL);

  const config: BetterAuthOptions = {
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: schema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.CORS_ORIGIN ? [env.CORS_ORIGIN] : [],
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
  };

  // Only add social providers if credentials are provided
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    config.socialProviders = {
      ...config.socialProviders,
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    };
  }

  if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
    config.socialProviders = {
      ...config.socialProviders,
      facebook: {
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
      },
    };
  }

  return betterAuth(config);
}

// For local development compatibility (when process.env is available)
export const auth =
  typeof process !== 'undefined' && process.env.BETTER_AUTH_SECRET
    ? createAuth(process.env as unknown as AuthEnv)
    : null;
