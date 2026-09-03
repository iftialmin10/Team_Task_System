import type { Priority, WorkItem, WorkStatus } from '@team-task-system/contracts';

export const statusLabels: Record<WorkStatus, string> = {
  BACKLOG: 'Backlog', READY: 'Ready', IN_PROGRESS: 'In progress', DONE: 'Done',
};

export const priorityLabels: Record<Priority, string> = {
  NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent',
};

export const statusClasses: Record<WorkStatus, string> = {
  BACKLOG: 'border-slate-300 bg-slate-100 text-slate-700',
  READY: 'border-blue-200 bg-blue-50 text-blue-800',
  IN_PROGRESS: 'border-violet-200 bg-violet-50 text-violet-800',
  DONE: 'border-green-300 bg-green-50 text-green-800',
};

export const priorityClasses: Record<Priority, string> = {
  NORMAL: 'text-slate-600',
  HIGH: 'border-orange-300 bg-orange-50 text-orange-800',
  URGENT: 'border-red-300 bg-red-50 font-semibold text-red-800',
};

function dateKeyInDhaka(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function utcDay(dateOnly: string) {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

export function getDuePresentation(item: Pick<WorkItem, 'dueDate' | 'status'>, now = new Date()) {
  if (!item.dueDate) return { label: 'No due date', tone: 'muted' as const };
  const dateOnly = item.dueDate.slice(0, 10);
  const formatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${dateOnly}T00:00:00.000Z`));
  if (item.status === 'DONE') return { label: formatted, tone: 'muted' as const };
  const difference = Math.round((utcDay(dateOnly) - utcDay(dateKeyInDhaka(now))) / 86_400_000);
  if (difference < 0) return { label: `Overdue by ${Math.abs(difference)} ${Math.abs(difference) === 1 ? 'day' : 'days'}`, tone: 'danger' as const };
  if (difference === 0) return { label: 'Due today', tone: 'warning' as const };
  return { label: formatted, tone: 'default' as const };
}

