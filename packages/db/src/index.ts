import { neon, neonConfig } from '@neondatabase/serverless';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure for edge environments (Cloudflare Workers, Vercel Edge, etc.)
if (typeof WebSocket === 'undefined') {
  // Only use ws in Node.js environments (local development)
  try {
    const ws = await import('ws');
    neonConfig.webSocketConstructor = ws.default;
  } catch {
    // In Cloudflare Workers, use fetch-based querying
    neonConfig.poolQueryViaFetch = true;
  }
} else {
  // In edge environments with native WebSocket, use fetch-based querying
  neonConfig.poolQueryViaFetch = true;
}

// Lazy initialization - create db connection only when DATABASE_URL is available
let dbInstance: NeonHttpDatabase | null = null;
let currentDatabaseUrl: string | null = null;

export const getDb = (databaseUrl?: string) => {
  // Use provided URL or fall back to process.env (for local development)
  const dbUrl = databaseUrl || process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Recreate connection if URL changed (for multi-tenant scenarios)
  if (dbInstance && currentDatabaseUrl !== dbUrl) {
    dbInstance = null;
  }

  if (!dbInstance) {
    currentDatabaseUrl = dbUrl;
    const sql = neon(dbUrl);
    dbInstance = drizzle(sql);
  }

  return dbInstance;
};

// Maintain backward compatibility for local development
export const db = new Proxy({} as NeonHttpDatabase, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase];
  },
});

// Re-export common drizzle-orm functions to ensure same instance
export { and, asc, count, desc, eq, not, or, sql } from 'drizzle-orm';
