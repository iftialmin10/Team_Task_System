# Team Tasks System

A simple shared task tracker for small teams. It is designed to replace a spreadsheet with a clearer way to find work, see what matters, and move tasks through a basic workflow.

## Live Link: https://team-task-system-web.vercel.app/work

## Running the project

```bash
git clone https://github.com/iftialmin10/Team_Task_System.git
cd Team_Task_System
npm install
cp .env.example .env
```

Create a database in Neon, copy its connection string, and add it to `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

Then create and seed the database:

```bash
npm run db:deploy
npm run db:seed
```

The seed command adds 10 users and 360 example work items.

Start the app:

```bash
npm run dev
```

The web app runs at <http://localhost:5173> and the API runs at <http://localhost:4000>.

## Screenshots

### Mobile - 375 px

![Mobile view at 375 pixels](docs/screenshots/375px.png)

### Tablet - 770 px

![Tablet view at 770 pixels](docs/screenshots/770px.png)

### Desktop - 1280 px

![Desktop view at 1280 pixels](docs/screenshots/1280px.png)

### Errors need a way to retry

![Errors need a way to retry](docs/screenshots/Error.png)

## Data model

The app uses two related models: `User` and `WorkItem`. One user can own many work items, while a work item can also be left unassigned.

A work item contains:

- a title;
- an optional description;
- a status;
- a priority;
- an optional owner;
- an optional due date; and
- created and updated timestamps.

Users are stored separately so owner details are not repeated on every item.

## Workflow

Work moves through four stages:

1. **Backlog** - the work has been accepted but is not ready to start.
2. **Ready** - the task is clear and can be picked up.
3. **In progress** - someone is actively working on it.
4. **Done** - the work is complete.


## Product decisions

### Layout

I chose a table/list instead of a Kanban board because the main job here is finding and comparing work across a few hundred items. Desktop shows the full table, tablet removes less important information, and mobile changes each row into a card so there is no horizontal scrolling.

### First screen

The first screen contains the things people are most likely to need: Add work, search, filters, sorting, sharing, and the work list. Less common information, such as the full description, stays in the item details.

The current search, filters, sorting, and page are stored in the URL. This means the **Share With Colleagues** button can copy a link to the same view.

### Mobile

On mobile, the Add work button becomes full width and work items are shown as cards. The filter controls move into a separate sheet opened with one Filters button. Changes are applied together, which avoids refreshing the list after every selection and leaves more room for the tasks themselves.

## What I decided not to build

I left out authentication, permissions, comments, attachments, notifications, subtasks, dependencies, time tracking, custom workflows, bulk actions, real-time updates, and a Kanban view.

## Decisions I am least confident about

1. **Using a list instead of Kanban.** The list is easier to search and scan, but Kanban would make workflow stages more visual. Both views could be offered in a later version.
2. **Using numbered pagination.** It keeps pages fast and shareable, but infinite scrolling may feel smoother for browsing. Cursor pagination or a virtualized list would be worth considering with larger datasets.

