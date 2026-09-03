# Team Tasks System

Phase 1 foundation for a responsive team work tracker. The repository is an npm-workspaces monorepo containing a React/TypeScript frontend, an Express/TypeScript API, shared Zod contracts, and a Prisma schema for Neon PostgreSQL.

## Prerequisites

- Node.js 20.19 or newer
- A Neon PostgreSQL project and connection string

No local PostgreSQL installation or Docker setup is required.

## Setup

1. Install packages: `npm install`
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to the Neon PostgreSQL connection URL.
4. Apply the committed migration: `npm run db:deploy`
5. Load the deterministic dataset: `npm run db:seed`
6. Start both applications: `npm run dev`

The web application runs at `http://localhost:5173/work`; the API runs at `http://localhost:4000/api`. Seeding replaces existing users and work items, so only run it against a development database.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Process health |
| `GET` | `/api/work-items` | Database-backed search, filters, sort, and pagination |
| `GET` | `/api/work-items/:id` | Fetch one work item |
| `POST` | `/api/work-items` | Create a work item |
| `PATCH` | `/api/work-items/:id` | Edit a work item |
| `PATCH` | `/api/work-items/:id/status` | Change workflow stage |
| `GET` | `/api/users` | List owners |

List parameters are `search`, `owner`, `status`, `priority`, `due`, `sort`, `order`, `page`, and `pageSize`. Page size is restricted to 25 or 50. Dates are evaluated in `Asia/Dhaka` and timestamps are stored in UTC.

Import [the Postman collection](docs/postman/Team-Task-System.postman_collection.json) to manually exercise every endpoint after the Neon migration and seed complete.

## Quality commands

- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run db:generate`

Automated API tests use injected services; frontend tests use MSW. Neither test suite substitutes mocks for the running production API.
