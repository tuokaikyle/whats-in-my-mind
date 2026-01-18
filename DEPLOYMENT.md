# Deployment Guide - Cloudflare

This guide walks you through deploying the "whats-in-my-mind" application to Cloudflare.

## Overview

- **Frontend (web)**: Deploy to **Cloudflare Pages**
- **Backend (server)**: Deploy to **Cloudflare Workers**
- **Database**: Use hosted PostgreSQL (Neon, Supabase, etc.) or migrate to Cloudflare D1

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally
   ```bash
   bun add -g wrangler
   ```
3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

## Part 1: Database Setup

### Option A: Use Hosted PostgreSQL (Recommended for quick start)

Use a PostgreSQL provider that works well with serverless:

1. **Neon** (Recommended - serverless PostgreSQL)
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Supabase**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Get the connection pooler URL (use transaction mode)

3. **Railway** or **Render** (both offer PostgreSQL hosting)

### Option B: Migrate to Cloudflare D1 (SQLite)

If you want to use Cloudflare's native database:
- Note: This requires migrating from PostgreSQL to D1 (SQLite-based)
- You'll need to update Drizzle configuration
- See [D1 documentation](https://developers.cloudflare.com/d1/)

## Part 2: Deploy Backend (Cloudflare Workers)

### 1. Install dependencies

```bash
bun install
```

### 2. Set up environment secrets

Set your secrets using Wrangler:

```bash
cd apps/server

# Database connection string
wrangler secret put DATABASE_URL
# Paste your PostgreSQL connection string when prompted

# Better Auth configuration
wrangler secret put BETTER_AUTH_SECRET
# Generate a random secret (e.g., openssl rand -base64 32)

wrangler secret put BETTER_AUTH_URL
# Your backend URL, e.g., https://whats-in-my-mind-api.your-subdomain.workers.dev
```

### 3. Update wrangler.toml

Edit `apps/server/wrangler.toml` and update:
- `name`: Your worker name (must be unique)
- `CORS_ORIGIN`: Your frontend URL (after deploying frontend)

### 4. Deploy the backend

```bash
cd apps/server
bun run deploy
```

Your API will be deployed to: `https://whats-in-my-mind-api.your-subdomain.workers.dev`

### 5. Run database migrations

After deploying, run migrations against your production database:

```bash
# Update DATABASE_URL in apps/server/.env to point to production
# Or set it temporarily:
DATABASE_URL="your-production-db-url" bun run db:migrate
```

## Part 3: Deploy Frontend (Cloudflare Pages)

### Option A: Deploy via Cloudflare Dashboard (Easiest)

1. **Push your code to GitHub/GitLab**

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Pages** → **Create a project**
   - Connect your Git repository
   - Select the repository

3. **Configure build settings**:
   - **Framework preset**: `Vite`
   - **Build command**: `cd apps/web && bun install && bun run build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/` (leave as is)
   - **Environment variables**:
     ```
     VITE_API_URL=https://your-backend-url.workers.dev
     ```

4. **Deploy**: Click "Save and Deploy"

### Option B: Deploy via Wrangler CLI

1. **Build the frontend**:
   ```bash
   cd apps/web
   bun run build
   ```

2. **Deploy to Pages**:
   ```bash
   wrangler pages deploy dist --project-name=whats-in-my-mind-web
   ```

Your frontend will be available at: `https://whats-in-my-mind-web.pages.dev`

## Part 4: Environment Configuration

### Update Backend CORS

After deploying the frontend, update the backend CORS settings:

```bash
cd apps/server
wrangler secret put CORS_ORIGIN
# Enter your frontend URL: https://whats-in-my-mind-web.pages.dev
```

Or update `wrangler.toml`:
```toml
[vars]
CORS_ORIGIN = "https://whats-in-my-mind-web.pages.dev"
```

Then redeploy:
```bash
bun run deploy
```

### Update Frontend API URL

If using environment variables in Vite, create `apps/web/.env.production`:

```env
VITE_API_URL=https://whats-in-my-mind-api.your-subdomain.workers.dev
```

Update your tRPC client to use this URL. In `apps/web/src/utils/trpc.ts`, ensure it uses the environment variable.

## Part 5: Custom Domain (Optional)

### For Backend (Workers)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to **Settings** → **Domains & Routes**
4. Add a custom domain (e.g., `api.yourdomain.com`)

### For Frontend (Pages)

1. Go to Cloudflare Dashboard → Pages
2. Select your project
3. Go to **Custom domains**
4. Add your domain (e.g., `app.yourdomain.com` or `yourdomain.com`)

## Troubleshooting

### Database Connection Issues

- Ensure your database accepts connections from Cloudflare Workers IPs
- Use connection pooling (Neon and Supabase provide this)
- Check that DATABASE_URL is correctly set as a secret

### CORS Errors

- Verify CORS_ORIGIN is set correctly in backend
- Check that credentials are enabled
- Ensure frontend is using the correct API URL

### Build Errors

- Make sure all dependencies are installed: `bun install`
- Check that build commands work locally
- Verify Node.js compatibility mode is enabled in wrangler.toml

## Monitoring and Logs

### View Worker Logs
```bash
cd apps/server
wrangler tail
```

### View Pages Deployment Logs
- Go to Cloudflare Dashboard → Pages → Your Project → Deployments

## Updating Your Application

### Backend
```bash
cd apps/server
# Make your changes
bun run deploy
```

### Frontend
- If using Git integration: Push to your repository (auto-deploys)
- If using CLI: `cd apps/web && bun run build && wrangler pages deploy dist`

## Cost Considerations

**Cloudflare Free Tier includes:**
- Workers: 100,000 requests/day
- Pages: Unlimited requests
- D1: 5GB storage (if you migrate)

**External Database:**
- Neon: Free tier with 0.5GB storage
- Supabase: Free tier with 500MB storage

For most projects, this setup will be completely free!

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Hono on Cloudflare](https://hono.dev/getting-started/cloudflare-workers)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
