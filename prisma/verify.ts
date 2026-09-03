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

const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });

async function main() {
  const indexes = await pool.query<{ indexname: string }>(`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = ANY($1::text[])
    ORDER BY indexname
  `, [expectedIndexes]);
  const found = indexes.rows.map(({ indexname }) => indexname);
  const missing = expectedIndexes.filter((name) => !found.includes(name));
  if (missing.length) throw new Error(`Missing query indexes: ${missing.join(', ')}`);

  const count = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM "WorkItem"');
  const plan = await pool.query<{ 'QUERY PLAN': string }>(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT w.id FROM "WorkItem" AS w
    LEFT JOIN "User" AS u ON u.id = w."ownerId"
    WHERE w.title ILIKE '%onboarding%' OR u.name ILIKE '%onboarding%'
    ORDER BY w."dueDate" ASC NULLS LAST, w."createdAt" DESC, w.id ASC
    LIMIT 25
  `);

  console.log(`Verified ${found.length} query-aligned indexes on ${count.rows[0]?.count ?? '0'} work items.`);
  console.log(plan.rows.map((row) => row['QUERY PLAN']).join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => pool.end());
