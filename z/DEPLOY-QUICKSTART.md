# 🚀 Quick Start - Deploy to Cloudflare

## Prerequisites (5 minutes)

```bash
# 1. Install Wrangler
bun add -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Install project dependencies
bun install
```

## Step 1: Set Up Database (5 minutes)

**Recommended: Use Neon (free, serverless PostgreSQL)**

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

## Step 2: Deploy Backend (5 minutes)

```bash
# Navigate to server directory
cd apps/server

# Set environment secrets
wrangler secret put DATABASE_URL
# Paste your database connection string

wrangler secret put BETTER_AUTH_SECRET
# Generate with: openssl rand -base64 32

wrangler secret put BETTER_AUTH_URL
# This will be: https://your-worker-name.workers.dev
# (check wrangler.toml for your worker name)

# Deploy!
bun run deploy
```

**Your backend is now live!** 🎉  
Note the URL: `https://your-worker-name.workers.dev`

## Step 3: Deploy Frontend (5 minutes)

### Option A: Auto-deploy with GitHub (Recommended)

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Pages** → **Create project**
4. Connect your repository
5. Configure:
   - **Build command**: `cd apps/web && bun install && bun run build`
   - **Build output**: `apps/web/dist`
   - **Environment variable**: 
     - Name: `VITE_SERVER_URL`
     - Value: `https://your-worker-name.workers.dev` (from Step 2)
6. Click **Save and Deploy**

### Option B: Manual Deploy via CLI

```bash
# Set your backend URL (from Step 2)
echo 'VITE_SERVER_URL=https://your-worker-name.workers.dev' > apps/web/.env.production

# Build and deploy
cd apps/web
bun run build
wrangler pages deploy dist --project-name=whats-in-my-mind-web
```

**Your frontend is now live!** 🎉  
Note the URL: `https://whats-in-my-mind-web.pages.dev`

## Step 4: Update CORS (2 minutes)

```bash
cd apps/server

# Edit wrangler.toml and update CORS_ORIGIN
# Change this line:
# CORS_ORIGIN = "https://your-frontend-url.pages.dev"

# Then redeploy
bun run deploy
```

## Step 5: Run Migrations (2 minutes)

```bash
# Set production database URL and run migrations
DATABASE_URL="your-production-db-url" bun run db:migrate
```

## ✅ Done! Test Your App

Visit your frontend URL and:
- Sign up for an account
- Create a todo
- Verify everything works

## 🎯 One-Command Deploy (After Initial Setup)

After the initial setup, you can deploy updates easily:

```bash
# Deploy backend
bun run deploy:server

# Deploy frontend (if using CLI)
bun run deploy:web

# Or deploy both
bun run deploy
```

## 🔧 Useful Commands

```bash
# View backend logs in real-time
cd apps/server && wrangler tail

# Test backend locally with Cloudflare environment
cd apps/server && bun run cf:dev

# List your deployments
wrangler deployments list

# Rollback to previous deployment (if needed)
wrangler rollback
```

## 💰 Pricing

All of this is **FREE** with Cloudflare's free tier:
- ✅ Cloudflare Workers: 100,000 requests/day
- ✅ Cloudflare Pages: Unlimited requests
- ✅ Neon Database: Free tier (0.5GB storage)

Perfect for hobby projects and small applications!

## 🆘 Having Issues?

1. Check the detailed guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Use the checklist: [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
3. Common fixes:
   - **Wrangler v4 error** → The `wrangler.toml` uses `nodejs_compat = true` (correct setting)
   - **CORS errors** → Check `CORS_ORIGIN` in `wrangler.toml`
   - **Auth errors** → Verify `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
   - **Database errors** → Check `DATABASE_URL` is set correctly
   - **Build errors** → Run `bun run build` locally first

## 🌟 Next Steps

- [ ] Set up custom domain
- [ ] Configure email sending
- [ ] Set up monitoring/analytics
- [ ] Add CI/CD pipeline

Enjoy your deployed app! 🚀
