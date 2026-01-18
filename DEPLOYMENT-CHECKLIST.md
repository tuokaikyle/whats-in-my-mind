# Deployment Checklist

Use this checklist to deploy your application to Cloudflare.

## Pre-deployment Setup

- [ ] Sign up for Cloudflare account
- [ ] Install Wrangler CLI: `bun add -g wrangler`
- [ ] Login to Cloudflare: `wrangler login`
- [ ] Choose and set up database (Neon/Supabase recommended)

## Database Setup

- [ ] Create production database (Neon, Supabase, etc.)
- [ ] Save connection string securely
- [ ] Run migrations: `DATABASE_URL="your-url" bun run db:migrate`

## Backend Deployment (Cloudflare Workers)

- [ ] Install dependencies: `bun install`
- [ ] Update `apps/server/wrangler.toml`:
  - [ ] Change `name` to your preferred worker name
  - [ ] Set `CORS_ORIGIN` (you'll update this after frontend deployment)
- [ ] Set secrets:
  ```bash
  cd apps/server
  wrangler secret put DATABASE_URL
  wrangler secret put BETTER_AUTH_SECRET
  wrangler secret put BETTER_AUTH_URL
  ```
- [ ] Deploy backend: `bun run deploy`
- [ ] Note your backend URL: `https://your-worker.workers.dev`
- [ ] Test backend: Visit the URL (should see "OK")

## Frontend Deployment (Cloudflare Pages)

### Option A: GitHub Integration (Recommended)

- [ ] Push code to GitHub/GitLab
- [ ] Go to Cloudflare Dashboard → Pages → Create project
- [ ] Connect repository
- [ ] Configure build:
  - Framework: Vite
  - Build command: `cd apps/web && bun install && bun run build`
  - Build output: `apps/web/dist`
  - Root directory: `/`
- [ ] Set environment variable:
  - `VITE_SERVER_URL` = your backend Worker URL
- [ ] Deploy
- [ ] Note your frontend URL: `https://your-app.pages.dev`

### Option B: CLI Deployment

- [ ] Build frontend: `cd apps/web && bun run build`
- [ ] Deploy: `wrangler pages deploy dist --project-name=your-app-name`
- [ ] Note your frontend URL

## Post-deployment Configuration

- [ ] Update backend CORS:
  ```bash
  cd apps/server
  # Edit wrangler.toml and change CORS_ORIGIN to your frontend URL
  # OR
  wrangler secret put CORS_ORIGIN
  # Then redeploy:
  bun run deploy
  ```
- [ ] Test the application:
  - [ ] Visit frontend URL
  - [ ] Try signing up/logging in
  - [ ] Test creating a todo
  - [ ] Check network tab for errors

## Optional: Custom Domain

- [ ] Add custom domain to Pages (for frontend)
- [ ] Add custom domain to Worker (for backend)
- [ ] Update CORS_ORIGIN in backend
- [ ] Update VITE_SERVER_URL in frontend environment variables

## Verification

- [ ] Frontend loads correctly
- [ ] API calls work (check network tab)
- [ ] Authentication works
- [ ] CRUD operations work
- [ ] No CORS errors
- [ ] Database connections are stable

## Quick Commands Reference

```bash
# Install dependencies
bun install

# Deploy backend
cd apps/server && bun run deploy

# Build frontend
cd apps/web && bun run build

# Deploy frontend (if using CLI)
cd apps/web && wrangler pages deploy dist

# View worker logs
cd apps/server && wrangler tail

# Set a secret
wrangler secret put SECRET_NAME
```

## Troubleshooting

If you encounter issues:

1. **CORS Errors**: Check `CORS_ORIGIN` is set correctly in backend
2. **Database Errors**: Verify `DATABASE_URL` secret is set and database is accessible
3. **Auth Errors**: Check `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are set
4. **Build Errors**: Test build locally first: `bun run build`
5. **Worker Logs**: Use `wrangler tail` to see real-time logs

## Need Help?

- See detailed guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
