# whats-in-my-mind

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
whats-in-my-mind/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
- `bun run deploy:server`: Deploy backend to Cloudflare Workers
- `bun run deploy:web`: Deploy frontend to Cloudflare Pages
- `bun run deploy`: Build and deploy backend

## Make things right
no logged in user to use local storage
consider to have a header bar - add todo button
edit todo
add test
经常fetch不到 得单独点route才可以成功fetch
google and facebook

确定现有shape
bubble - effort columns, category table
flip - easy
heatmap

user-preferences
category table
color set

react hook form
select

order by created date
click catetory, open from down
color set ready
add effort
please tell me if using tanstack form and a state manager like zustland would make thing easier? 

now go back to point 1: please use the types that I defined in apps/web/src/utils/types.ts in Simple 


原则
一定是可以未登陆尝试
一定有原始数据
最好能尝试所有页面 所有功能
同步 不一定有 就让它存在于local
得有sample data
anonymous plugin 
have stats on how many users

strategies:
react state
local storage - no sync
local storage - with sync
anonymous account

think:
one model multiple views
or 
multi models multi views


## dev log
main -> can change to v1
original

v2
use better t

v3
more better-t, polished

has better-t postgres as a remote. 

v4
1. remove flip. this will be a new app. flip means accomplishing DAILY jobs. github view shows how well-accomplished a day is. 
2. 

##  quick note
cloudflare prod:
https://whats-in-my-mind.pages.dev/
brand: v3

preview:
All non-production branches. Now I changed it to none. and no auto deploy to prod. This can be toggled. 

local 
db dev

deployed can be cloudflare production and preview. 
web is deployed automatically after a push. 
api needs to be deployed manually. the command needs to log into cloudflare through wrangler. 
wed deploy page - there is a vite server url. this needs to be the domain of the api deployments. maybe no need to have the / in the end. 