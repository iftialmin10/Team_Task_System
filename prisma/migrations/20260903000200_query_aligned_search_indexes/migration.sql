-- Prisma's case-insensitive `contains` filter emits ILIKE against the column.
-- Plain-column trigram indexes therefore match the actual title and owner-name queries.
DROP INDEX IF EXISTS "WorkItem_title_trgm_idx";
DROP INDEX IF EXISTS "User_name_trgm_idx";

CREATE INDEX "WorkItem_title_trgm_idx" ON "WorkItem" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "User_name_trgm_idx" ON "User" USING GIN ("name" gin_trgm_ops);
