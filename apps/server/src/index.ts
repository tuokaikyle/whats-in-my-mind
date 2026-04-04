// Load dotenv only in local development (not in Cloudflare Workers)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

import { trpcServer } from '@hono/trpc-server';
import { createContext } from '@whats-in-my-mind/api/context';
import { appRouter } from '@whats-in-my-mind/api/routers/index';
import { createAuth, type AuthEnv } from '@whats-in-my-mind/auth';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Define the environment type for Cloudflare Workers
type Env = AuthEnv;

const app = new Hono<{ Bindings: Env }>();

// Create auth instance lazily per request (or cache it)
let authInstance: ReturnType<typeof createAuth> | null = null;
function getAuth(env: Env) {
  if (!authInstance) {
    authInstance = createAuth(env);
  }
  return authInstance;
}

app.use(logger());
app.use(
  '/*',
  cors({
    // In Cloudflare Workers, `wrangler.toml [vars]` are provided via the `env`
    // binding (Hono: `c.env`), not reliably via `process.env`.
    origin: (requestOrigin, c) => {
      const configured = (c.env?.CORS_ORIGIN ?? process.env.CORS_ORIGIN ?? '').trim();
      if (!configured) return '';

      // Allow comma-separated list for multi-environment deploys.
      const allowed = configured
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      // With `credentials: true`, we must return an explicit origin (not '*').
      if (allowed.includes('*')) return requestOrigin;
      if (allowed.includes(requestOrigin)) return requestOrigin;
      return '';
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get('/', (c) => {
  return c.text('OK');
});

export default app;
