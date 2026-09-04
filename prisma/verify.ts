import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const expectedIndexes = [
  'User_name_trgm_idx',
  'WorkItem_ownerId_idx',
  'WorkItem_status_dueDate_idx',
  'WorkItem_title_trgm_idx',
];
const expectedMigrations = [
  '20260903000100_initial',
  '20260903000200_query_aligned_search_indexes',
];

const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, enableChannelBinding: true });

async function main() {
  const migrations = await pool.query<{ migration_name: string }>(`
    SELECT migration_name FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    ORDER BY migration_name
  `);
  const appliedMigrations = migrations.rows.map(({ migration_name }) => migration_name);
  const missingMigrations = expectedMigrations.filter((name) => !appliedMigrations.includes(name));
  if (missingMigrations.length) throw new Error(`Missing migrations: ${missingMigrations.join(', ')}`);

  const indexes = await pool.query<{ indexname: string }>(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ANY($1::text[])
    ORDER BY indexname
  `, [expectedIndexes]);
  const found = indexes.rows.map(({ indexname }) => indexname);
  const missing = expectedIndexes.filter((name) => !found.includes(name));
  if (missing.length) throw new Error(`Missing query indexes: ${missing.join(', ')}`);

  const foreignKey = await pool.query<{ delete_rule: string }>(`
    SELECT delete_rule FROM information_schema.referential_constraints
    WHERE constraint_schema = 'public' AND constraint_name = 'WorkItem_ownerId_fkey'
  `);
  if (foreignKey.rows[0]?.delete_rule !== 'SET NULL') {
    throw new Error('WorkItem owner foreign key must use ON DELETE SET NULL');
  }

  const count = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM "WorkItem"');
  const workItemCount = Number(count.rows[0]?.count ?? 0);
  if (workItemCount < 300) throw new Error(`Expected at least 300 work items, found ${workItemCount}`);

  const searchPlan = await pool.query<{ 'QUERY PLAN': string }>(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT w.id FROM "WorkItem" AS w
    LEFT JOIN "User" AS u ON u.id = w."ownerId"
    WHERE w.title ILIKE '%onboarding%' OR u.name ILIKE '%onboarding%'
    ORDER BY w."dueDate" ASC NULLS LAST, w."createdAt" DESC, w.id ASC
    LIMIT 25
  `);
  const filteredPlan = await pool.query<{ 'QUERY PLAN': string }>(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT w.id FROM "WorkItem" AS w
    WHERE w.status = 'IN_PROGRESS' AND w."dueDate" < CURRENT_DATE
    ORDER BY w."dueDate" ASC NULLS LAST, w."createdAt" DESC, w.id ASC
    LIMIT 25
  `);

  console.log(`Verified ${expectedMigrations.length} migrations, ${found.length} query-aligned indexes, the owner constraint, and ${workItemCount} work items.`);
  console.log('\nSearch query plan:\n' + searchPlan.rows.map((row) => row['QUERY PLAN']).join('\n'));
  console.log('\nFiltered query plan:\n' + filteredPlan.rows.map((row) => row['QUERY PLAN']).join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => pool.end());
