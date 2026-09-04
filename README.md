# Team Tasks System

Team Tasks System is a responsive shared-work tracker for a team of roughly 8-15 people. It replaces an increasingly hard-to-trust spreadsheet with one place to find, review, create, prioritize, and move work forward. Browse state lives in the URL, so a searched, filtered, sorted, or paginated view can be copied and reopened.

## Run from a clean clone

### Prerequisites

- Node.js 20.19 or newer and npm
- A Neon PostgreSQL database

### Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/iftialmin10/Team_Task_System.git
   cd Team_Task_System
   npm install
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

   On PowerShell, use `Copy-Item .env.example .env` instead.

3. Create a Neon project and copy its PostgreSQL connection string into `DATABASE_URL` in `.env`:

   ```dotenv
   DATABASE_URL="postgresql://ROLE:PASSWORD@ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require"
   ```

   Use the connection string supplied by Neon; no additional pooling or channel-binding setup is required.

4. Apply the committed migrations and load representative data:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

   The seed creates 10 users and 360 work items. **It first deletes all existing users and work items in the configured database**, so only run it against a database whose data may be replaced. Set `SEED_REFERENCE_DATE=YYYY-MM-DD` in `.env` when repeatable date-relative seed data is needed; otherwise the current date in `Asia/Dhaka` is used.

5. Start the API and web app together:

   ```bash
   npm run dev
   ```

   Open <http://localhost:5173>. The API runs at <http://localhost:4000>; its health endpoint is <http://localhost:4000/api/health>.

Useful verification commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:status
npm run db:verify
```

`db:verify` checks the migrations, query-aligned indexes, owner foreign-key behavior, seed volume, and representative PostgreSQL query plans.

## Screenshots

### 375 px - mobile cards

![Team Tasks System at 375 pixels](docs/screenshots/375px.png)

### 770 px - reduced tablet table

![Team Tasks System at 770 pixels](docs/screenshots/770px.png)

### 1280 px - full desktop table

![Team Tasks System at 1280 pixels](docs/screenshots/1280px.png)

## Data model

The deliberately small relational model has one `User` to zero or more `WorkItem` records:

```text
User (1) -------- (many) WorkItem
                         ownerId is optional
```

| Entity/field | Meaning and reason |
| --- | --- |
| `User`: `id`, `name`, `email` | A stable assignee record. Email is unique, and name is indexed because owner names are searchable. |
| `WorkItem.id` | Stable generated identity for API routes and shareable detail links. |
| `title` | The required, primary searchable and scannable description of the work. |
| `description` | Optional longer context, kept out of the dense list and shown in details. |
| `status` | Required workflow stage; defaults to `BACKLOG`. |
| `priority` | Required urgency signal (`NORMAL`, `HIGH`, or `URGENT`); defaults to `NORMAL`. |
| `ownerId` | Optional assignee. `null` explicitly represents unassigned work. Deleting a user sets this field to `null` instead of deleting their work. |
| `dueDate` | Optional date-only deadline used for overdue, due-today, upcoming, and no-date views. |
| `createdAt`, `updatedAt` | Server-managed audit and deterministic sorting fields. |

This normalization avoids repeating owner details across work items while keeping the model easy to query. PostgreSQL performs search, filtering, sorting, counting, and bounded pagination. Indexes cover common status, owner, priority, due-date, created/updated-time queries; trigram indexes support case-insensitive title and owner-name search without loading the backlog into the browser.

## What a work item includes

A work item consists of a required title and status, plus priority, optional description, optional owner, optional due date, and server-managed identity/timestamps. The create form asks only for title, owner, due date, priority, and description. New items enter **Backlog** automatically, avoiding a status choice before the work has been triaged.

Comments, attachments, subtasks, dependencies, labels, estimates, time tracking, activity history, and custom fields were left out. They are useful collaboration features, but none is required to prove the core find-review-progress workflow, and each would add data-model and mobile-interface complexity.

## Workflow

1. **Backlog** - accepted work that has not yet been prepared or started.
2. **Ready** - clarified work that is available to begin.
3. **In progress** - work currently being carried out.
4. **Done** - completed work.

Four fixed stages make progress understandable without introducing overlapping handoff states. Users can select any stage directly so corrections are quick; the MVP does not impose transition rules. Done items keep their due date for context but are no longer marked overdue.

## Product decisions

### Layout

A responsive list/table was chosen over a Kanban board because this product is optimized for locating and comparing a few hundred records. At 1024 px and wider, a six-column semantic table exposes title, owner, status, priority, due state, and last update. From 768-1023 px, the table drops the updated column. Below 768 px, it becomes stacked cards rather than forcing horizontal scrolling.

Status and priority remain editable directly in every row/card. Selecting a title opens the full record for review and editing. Explicit labels such as `Overdue by 3 days`, `Unassigned`, and the priority/status text carry meaning without relying on color alone.

### First screen

The first screen prioritizes the actions used most often:

- the workspace context, page title, and short purpose statement;
- a prominent **Add work** action;
- title/owner search;
- owner, status, priority, and due-state filters plus sorting;
- **Share With Colleagues**, which copies the current URL-backed view; and
- the work list, with status and priority controls available without opening a detail view.

The default sort is soonest due date, placing undated work last, with 25 records per page. Search, filters, sorting, page, page size, and an opened item are represented in query parameters so browser history and shared links reconstruct the same view.

### Mobile adaptation

At mobile widths, **Add work** becomes a full-width action, the table becomes two-column-detail cards, and the desktop filter row is replaced by one **Filters** button. That button opens a focus-trapped sheet where changes are drafted and applied together, preventing the list from refreshing after every selection. Controls have at least 44 px touch targets; dialogs lock background scrolling, close with Escape/backdrop actions, and restore focus when closed.

## Intentionally not built

- **Authentication, roles, and permissions:** the MVP assumes one trusted shared workspace; access control would require a separate identity and authorization design.
- **Comments, mentions, attachments, notifications, and activity history:** valuable for collaboration, but broader than the core tracking loop.
- **Subtasks, dependencies, labels, estimates, time tracking, and custom fields:** these would make both the model and the small-screen presentation substantially denser.
- **Configurable workflows and transition rules:** fixed stages keep terminology, validation, filtering, and inline editing predictable.
- **Drag-and-drop Kanban:** weaker than a compact table for scanning and filtering hundreds of items, particularly on mobile.
- **Bulk actions, imports/exports, and real-time collaboration:** useful next steps, but not necessary to validate a reliable replacement for the shared spreadsheet.

## Decisions with the most uncertainty

1. **List/table instead of Kanban.** The list is stronger for search, comparison, and scale, but a Kanban board would make work-in-progress and stage movement more visual. A later release could offer Kanban as a second view over the same status field.
2. **Four fixed stages with unrestricted transitions.** This is simple and forgiving, but some teams may need `Blocked`, review/approval stages, or enforced transitions. Alternatives are a fifth fixed Blocked state, a separate blocked flag, or workspace-configurable workflows.
3. **Numbered server pagination with a 25-item default.** It gives stable URLs and bounded database work, but it interrupts continuous scanning. Cursor pagination, infinite scrolling, or a virtualized list are alternatives if usage grows or teams strongly prefer uninterrupted browsing.

## AI tooling

AI tooling was used as a development assistant for requirements decomposition, implementation planning, code scaffolding and review, test-case suggestions, and documentation drafting. Product scope, data-model choices, responsive behavior, and generated changes were checked against the running implementation and automated tests. AI is not part of the shipped application at runtime: work-item content, search, prioritization, and workflow changes are deterministic and remain under user control.

## Configuration reference

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string supplied by Neon. |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production`. |
| `PORT` | No | `4000` | API port. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed browser origin for split deployments. |
| `DATABASE_POOL_MAX` | No | `10` | Maximum database connections, capped at 20. |
| `DATABASE_CONNECT_TIMEOUT_MS` | No | `10000` | Database connection timeout. |
| `DATABASE_IDLE_TIMEOUT_MS` | No | `30000` | Idle connection timeout. |
| `SEED_REFERENCE_DATE` | No | Current Dhaka date | Optional `YYYY-MM-DD` anchor for deterministic seed dates. |
| `VITE_API_URL` | No | `/api` | API base URL when frontend and API use different origins. |

For production, configure the environment, run `npm run build` and `npm run db:deploy`, then run `npm start`. Serve `apps/web/dist` as static files and route `/api` to the API service.
