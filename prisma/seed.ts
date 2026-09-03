import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Priority, WorkStatus } from '../apps/api/src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const anchor = new Date('2026-09-03T00:00:00.000Z');
const day = 86_400_000;
const statuses = Object.values(WorkStatus);
const priorities = Object.values(Priority);

const people = [
  ['usr_01', 'Samira Khan', 'samira.khan@example.com'],
  ['usr_02', 'Alexandra Montgomery-Jones', 'alexandra.montgomery-jones@example.com'],
  ['usr_03', 'Tanvir Ahmed', 'tanvir.ahmed@example.com'],
  ['usr_04', 'Maya Rodriguez', 'maya.rodriguez@example.com'],
  ['usr_05', 'Noah Williams', 'noah.williams@example.com'],
  ['usr_06', 'Priya Chowdhury', 'priya.chowdhury@example.com'],
  ['usr_07', 'Oliver Chen', 'oliver.chen@example.com'],
  ['usr_08', 'Fatima Rahman', 'fatima.rahman@example.com'],
  ['usr_09', 'Lucas Martin', 'lucas.martin@example.com'],
  ['usr_10', 'Zara Hossain', 'zara.hossain@example.com'],
] as const;

const actions = ['Prepare', 'Review', 'Update', 'Investigate', 'Document', 'Validate', 'Coordinate', 'Improve', 'Launch', 'Audit'];
const subjects = ['customer onboarding', 'Q4 infrastructure proposal', 'release checklist', 'mobile accessibility', 'billing reconciliation', 'support handoff', 'analytics dashboard', 'design tokens', 'security questionnaire', 'partner integration', 'performance baseline', 'incident follow-up'];
const suffixes = ['for enterprise customers', 'before the next planning session', 'across all supported breakpoints', 'with the customer success team', 'for the September release', 'and document the final decision'];

async function main() {
  await prisma.workItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.createMany({ data: people.map(([id, name, email]) => ({ id, name, email })) });

  const records = Array.from({ length: 360 }, (_, index) => {
    const status = statuses[index % statuses.length]!;
    const title = index === 0
      ? 'Prepare a comprehensive customer onboarding guide for enterprise customers migrating from legacy workspaces with complex permission requirements'
      : `${actions[index % actions.length]} ${subjects[(index * 7) % subjects.length]}${index % 9 === 0 ? ` ${suffixes[index % suffixes.length]}` : ''}`;
    const dueOffset = index === 0 ? -3 : index === 1 ? 0 : ((index * 13) % 121) - 45;
    const createdAt = new Date(anchor.getTime() - (360 - index) * 3_600_000);
    return {
      id: `wrk_${String(index + 1).padStart(3, '0')}`,
      title,
      description: index % 6 === 0 ? null : `Context for ${title.toLowerCase()}. Confirm the outcome with stakeholders and record follow-up actions.`,
      status,
      priority: index % 17 === 0 ? Priority.URGENT : priorities[(index * 5) % priorities.length]!,
      ownerId: index % 8 === 0 ? null : people[(index * 3) % people.length]![0],
      dueDate: index % 7 === 0 ? null : new Date(anchor.getTime() + dueOffset * day),
      createdAt,
      updatedAt: new Date(Math.min(anchor.getTime(), createdAt.getTime() + (index % 48) * 3_600_000)),
    };
  });
  await prisma.workItem.createMany({ data: records });
  console.log(`Seeded ${people.length} users and ${records.length} work items.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
