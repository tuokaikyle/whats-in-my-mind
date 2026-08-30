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

## Task Views

The same task data can be explored through several focused views:

| View | Purpose | Tracks | Key interactions |
| --- | --- | --- | --- |
| **Simple** | A clean checklist for quick capture and reordering | Progress, effort | Drag items, click progress dots, quick edit |
| **Progress** | Track task progress and effort with progress bars | Progress, effort, creation time | Click progress bars, sort tasks, quick edit, replay animation |
| **Bubble** | Display tasks as bubbles grouped by category and sized by effort | Effort, category | Click and drag bubbles, edit from the side panel |
| **Tree Map** | Organize tasks by category in a space-filling layout | Effort, category | Drill into categories and edit from the side panel |
| **Ring** | Represent each active task as an arc whose length is effort and fill is progress | Progress, effort, category | Select arcs, edit from the side panel, replay animation |
| **KPI Gauge** | Compare up to three selected tasks as concentric progress rings | Progress, effort, category | Pick tasks, select rings, edit from the side panel |
| **Readiness** | Assess how ready unstarted tasks are to begin | Readiness | Set readiness and sort tasks; tasks with progress are hidden |
| **Completed** | Browse completed tasks from newest to oldest | Progress, category | Quick edit completed tasks |

View names, descriptions, tracked fields, and features are maintained in [`apps/web/src/utils/page-metadata.ts`](apps/web/src/utils/page-metadata.ts).

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
