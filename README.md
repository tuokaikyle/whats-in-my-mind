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

The same task data can be explored through different views:

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

### Prerequisites

- [Bun 1.2.15](https://bun.sh/) (the version declared by this repository)
- A PostgreSQL-compatible database, such as a local PostgreSQL instance or Neon

Install the dependencies:

```bash
bun install
```

### Environment Setup

Create local environment files from the tracked examples:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Configure these variables before starting the application:

| File | Variable | Required | Purpose |
| --- | --- | --- | --- |
| `apps/server/.env` | `DATABASE_URL` | Yes | PostgreSQL connection used by the API and as the default for database commands |
| `apps/server/.env` | `BETTER_AUTH_SECRET` | Yes | Secret used to sign and encrypt authentication data; use a long, random value |
| `apps/server/.env` | `BETTER_AUTH_URL` | Yes | Public base URL of the API, such as `http://localhost:3000` |
| `apps/server/.env` | `CORS_ORIGIN` | Yes | Allowed web-app origin, such as `http://localhost:3001`; separate multiple origins with commas |
| `apps/server/.env` | `RESEND_API_KEY` | Yes | Resend API key used for required email verification and password-reset messages |
| `apps/web/.env` | `VITE_SERVER_URL` | Yes | API base URL used by the web client, such as `http://localhost:3000` |

`RESEND_FROM_EMAIL` is optional and defaults to `onboarding@resend.dev`. Set it to a verified sender address for deployed environments.

Google and GitHub sign-in are optional. To enable either provider, set both variables in its pair:

- Google: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- GitHub: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

The remaining database variables are optional overrides for development, direct migration connections, and production deployments: `DATABASE_URL_DEV`, `DATABASE_URL_DEV_DIRECT`, `DATABASE_URL_PRODUCTION`, and `DATABASE_URL_MIGRATE`.

### Database Setup

This project uses PostgreSQL with Drizzle ORM.

After configuring `DATABASE_URL`, apply the schema:

```bash
bun run db:push
```

### Run Locally

Start the development servers:

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

## License

This project's original source code is licensed under the [MIT License](LICENSE).

**Bubble**, **Tree Map**, and **KPI Gauge** depend on [Highcharts](https://www.highcharts.com/), which is proprietary software owned by Highsoft. Highcharts is not covered by this project's MIT license. Use of Highcharts is governed by the [Highcharts End User License Agreement](https://shop.highcharts.com/license-eula).

This project's own deployment is intended as personal, non-commercial use. If you fork or redeploy this project, you must comply with the Highcharts EULA yourself. Commercial, organizational, freelance, or other non-personal use requires a paid Highcharts license from [Highsoft](https://www.highcharts.com/license).
