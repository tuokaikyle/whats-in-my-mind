import { type AuthEnv, createAuth } from '@whats-in-my-mind/auth';
import { getDb } from '@whats-in-my-mind/db';
import type { Context as HonoContext } from 'hono';

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // Get auth instance with environment variables from Cloudflare Workers
  const env = context.env as AuthEnv;
  const auth = createAuth(env);
  const db = getDb(env.DATABASE_URL);

  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
