import { getDb } from '@whats-in-my-mind/db';
import * as schema from '@whats-in-my-mind/db/schema/auth';
import type { BetterAuthOptions } from 'better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Resend } from 'resend';
import { renderResetPassword } from './emails/reset-password';
import { renderVerifyEmail } from './emails/verify-email';

// Define env type for Cloudflare Workers
export interface AuthEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL?: string;
}

// Create auth configuration factory that accepts environment variables
export function createAuth(env: AuthEnv) {
  // Fall back to process.env for local Bun dev (c.env is empty outside Workers)
  const databaseUrl = env?.DATABASE_URL ?? process.env.DATABASE_URL;
  const secret = env?.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? '';
  const baseURL = env?.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? '';
  const corsOrigin = env?.CORS_ORIGIN ?? process.env.CORS_ORIGIN ?? '';
  const googleClientId = env?.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = env?.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = env?.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = env?.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET;
  const resendApiKey = env?.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  const fromEmail = env?.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!resendApiKey?.trim()) {
    throw new Error('RESEND_API_KEY is required because email verification is enabled');
  }

  const db = getDb(databaseUrl);

  // Use secure/sameSite:none only in production (HTTPS). Local dev is HTTP.
  const isProduction = baseURL.startsWith('https://');

  const resend = new Resend(resendApiKey);

  const config: BetterAuthOptions = {
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: schema,
    }),
    secret,
    baseURL,
    trustedOrigins: corsOrigin
      ? corsOrigin
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : [],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        const html = await renderResetPassword(url);
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Reset your password',
          html,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        const html = await renderVerifyEmail(url);
        await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Verify your email address',
          html,
        });
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        httpOnly: true,
      },
    },
  };

  // Only add social providers if credentials are provided
  if (googleClientId && googleClientSecret) {
    config.socialProviders = {
      ...config.socialProviders,
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    };
  }

  if (githubClientId && githubClientSecret) {
    config.socialProviders = {
      ...config.socialProviders,
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
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
