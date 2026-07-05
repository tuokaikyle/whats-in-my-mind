import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({
  path: '../../apps/server/.env',
});

const dbTarget = process.env.DB_TARGET ?? 'dev';
const migrationUrl = process.env.DATABASE_URL_MIGRATE;
const productionUrl =
  process.env.DATABASE_URL_PRODUCTION ?? process.env.DATABASE_URL;
const devUrl =
  process.env.DATABASE_URL_DIRECT ??
  process.env.DATABASE_URL_DEV ??
  process.env.DATABASE_URL;
const url =
  migrationUrl ?? (dbTarget === 'production' ? productionUrl : devUrl) ?? '';

if (!url) {
  throw new Error(
    dbTarget === 'production'
      ? 'Production migration URL is not set. Set DATABASE_URL_PRODUCTION, DATABASE_URL, or DATABASE_URL_MIGRATE.'
      : 'Development migration URL is not set. Set DATABASE_URL_DIRECT, DATABASE_URL_DEV, DATABASE_URL, or DATABASE_URL_MIGRATE.',
  );
}

console.log(`Drizzle database target: ${migrationUrl ? 'override' : dbTarget}`);

export default defineConfig({
  schema: './src/schema',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
