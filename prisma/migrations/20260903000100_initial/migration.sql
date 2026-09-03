CREATE TYPE "WorkStatus" AS ENUM ('BACKLOG', 'READY', 'IN_PROGRESS', 'DONE');
CREATE TYPE "Priority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkStatus" NOT NULL DEFAULT 'BACKLOG',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "ownerId" TEXT,
  "dueDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_name_idx" ON "User"("name");
CREATE INDEX "WorkItem_status_idx" ON "WorkItem"("status");
CREATE INDEX "WorkItem_ownerId_idx" ON "WorkItem"("ownerId");
CREATE INDEX "WorkItem_priority_idx" ON "WorkItem"("priority");
CREATE INDEX "WorkItem_dueDate_idx" ON "WorkItem"("dueDate");
CREATE INDEX "WorkItem_status_dueDate_idx" ON "WorkItem"("status", "dueDate");
CREATE INDEX "WorkItem_createdAt_idx" ON "WorkItem"("createdAt");
CREATE INDEX "WorkItem_updatedAt_idx" ON "WorkItem"("updatedAt");

ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- These query-aligned trigram indexes keep case-insensitive title/owner search responsive.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "WorkItem_title_trgm_idx" ON "WorkItem" USING GIN (lower("title") gin_trgm_ops);
CREATE INDEX "User_name_trgm_idx" ON "User" USING GIN (lower("name") gin_trgm_ops);
