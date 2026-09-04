# Team Task System

## Installation

Requirements: Node.js 20.19 or newer and a pooled Neon PostgreSQL connection.

```bash
git clone <repository-url>
cd Team_Task_System
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
```

Set `DATABASE_URL` in `.env` before running the database commands. Seeding replaces all existing users and work items.

## Development

```bash
npm run dev
```

The web application runs at `http://localhost:5173`; the API runs at `http://localhost:4000`.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:status
npm run db:verify
```

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | — | Pooled Neon PostgreSQL URL using `sslmode=verify-full` or Neon's `sslmode=require&channel_binding=require`. |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production`. |
| `PORT` | No | `4000` | API port. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed browser origin for split deployments. |
| `DATABASE_POOL_MAX` | No | `10` | Maximum database connections; capped at 20. |
| `DATABASE_CONNECT_TIMEOUT_MS` | No | `10000` | Database connection timeout. |
| `DATABASE_IDLE_TIMEOUT_MS` | No | `30000` | Idle connection timeout. |
| `SEED_REFERENCE_DATE` | No | Current Dhaka date | Optional `YYYY-MM-DD` anchor for repeatable seed data. |
| `VITE_API_URL` | No | `/api` | API base URL when the frontend and API use different origins. |

For production, configure the environment variables, run `npm run build`, apply migrations with `npm run db:deploy`, and start the API with `npm start`. Serve `apps/web/dist` as static files and route `/api` to the API service.
