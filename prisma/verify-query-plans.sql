-- Run with Neon's SQL editor after `npm run db:deploy` and `npm run db:seed`.
-- The first query confirms the expected indexes exist. EXPLAIN verifies representative
-- API query shapes; PostgreSQL may prefer a sequential scan for the small seed dataset.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'WorkItem_title_trgm_idx', 'User_name_trgm_idx',
    'WorkItem_status_dueDate_idx', 'WorkItem_ownerId_idx'
  )
ORDER BY indexname;

EXPLAIN (ANALYZE, BUFFERS)
SELECT w.*
FROM "WorkItem" AS w
LEFT JOIN "User" AS u ON u.id = w."ownerId"
WHERE w.title ILIKE '%onboarding%' OR u.name ILIKE '%onboarding%'
ORDER BY w."dueDate" ASC NULLS LAST, w."createdAt" DESC, w.id ASC
LIMIT 25 OFFSET 0;

EXPLAIN (ANALYZE, BUFFERS)
SELECT w.*
FROM "WorkItem" AS w
WHERE w.status = 'IN_PROGRESS'
  AND w."dueDate" < CURRENT_DATE
ORDER BY w."dueDate" ASC NULLS LAST, w."createdAt" DESC, w.id ASC
LIMIT 25 OFFSET 0;
