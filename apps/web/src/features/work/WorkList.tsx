import type { WorkItem, WorkStatus } from '@team-task-system/contracts';
import { getDuePresentation, priorityClasses, priorityLabels, statusClasses, statusLabels } from './presentation';

function StatusBadge({ item }: { item: WorkItem }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span>;
}

function Priority({ item }: { item: WorkItem }) {
  const notable = item.priority !== 'NORMAL';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${notable ? 'border px-2 py-0.5 text-xs' : 'text-sm'} ${priorityClasses[item.priority]}`}>
      {item.priority === 'URGENT' && <span aria-hidden="true">!</span>}{priorityLabels[item.priority]}
    </span>
  );
}

function Owner({ item }: { item: WorkItem }) {
  return item.owner
    ? <span className="block truncate" title={item.owner.name}>{item.owner.name}</span>
    : <span className="inline-flex rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-800">Unassigned</span>;
}

function Due({ item }: { item: WorkItem }) {
  const due = getDuePresentation(item);
  const classes = due.tone === 'danger' ? 'font-semibold text-red-800' : due.tone === 'warning' ? 'font-semibold text-amber-800' : due.tone === 'muted' ? 'text-muted' : 'text-ink';
  return <span className={classes}>{due.label}</span>;
}

export function WorkList({ items, onOpen, onStatus, pendingStatusId, failedStatusId, onRetryStatus }: {
  items: WorkItem[];
  onOpen: (id: string) => void;
  onStatus: (item: WorkItem, status: WorkStatus) => void;
  pendingStatusId: string | undefined;
  failedStatusId: string | undefined;
  onRetryStatus: () => void;
}) {
  const statusControl = (item: WorkItem) => {
    const stages: WorkStatus[] = ['BACKLOG', 'READY', 'IN_PROGRESS', 'DONE'];
    const next = stages[(stages.indexOf(item.status) + 1) % stages.length]!;
    return (
    <div>
      <button type="button" disabled={pendingStatusId === item.id} onClick={() => onStatus(item, next)} aria-label={`Move ${item.title} to ${statusLabels[next]}`} className={`min-h-11 rounded-lg border px-2.5 text-xs font-semibold hover:brightness-95 active:brightness-90 ${statusClasses[item.status]}`}>{pendingStatusId === item.id ? 'Moving…' : statusLabels[item.status]}</button>
      {failedStatusId === item.id && <div className="mt-1 text-xs text-red-700" role="alert">Update failed. <button type="button" onClick={onRetryStatus} className="font-semibold underline">Retry</button></div>}
    </div>
    );
  };
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-white shadow-subtle md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">Team work items</caption>
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="w-[35%] px-4 py-3 lg:w-[34%]">Work item</th>
              <th scope="col" className="w-[20%] px-4 py-3 lg:w-[18%]">Owner</th>
              <th scope="col" className="w-[18%] px-4 py-3 lg:w-[15%]">Status</th>
              <th scope="col" className="hidden w-[12%] px-4 py-3 lg:table-cell">Priority</th>
              <th scope="col" className="w-[27%] px-4 py-3 lg:w-[13%]">Due</th>
              <th scope="col" className="hidden w-[16%] px-4 py-3 xl:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="min-h-14 hover:bg-slate-50">
                <th scope="row" className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => onOpen(item.id)} className="block min-h-11 w-full truncate rounded-md text-left text-primary underline-offset-2 hover:underline active:text-blue-900" title={item.title}>{item.title}</button>
                  {item.priority !== 'NORMAL' && <span className="mt-1 inline-flex lg:hidden"><Priority item={item} /></span>}
                </th>
                <td className="px-4 py-3"><Owner item={item} /></td>
                <td className="px-4 py-3">{statusControl(item)}</td>
                <td className="hidden px-4 py-3 lg:table-cell"><Priority item={item} /></td>
                <td className="px-4 py-3"><Due item={item} /></td>
                <td className="hidden px-4 py-3 text-muted xl:table-cell">{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.updatedAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label="Team work items">
        {items.map((item) => (
          <li key={item.id} className="min-w-0 rounded-xl border bg-white p-4 shadow-subtle">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h2 className="min-w-0 text-base font-semibold leading-6"><button type="button" onClick={() => onOpen(item.id)} className="min-h-11 text-left text-primary underline-offset-2 hover:underline active:text-blue-900" title={item.title}>{item.title}</button></h2>
              <StatusBadge item={item} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              <div className="min-w-0"><span className="mb-1 block text-xs font-medium text-muted">Owner</span><Owner item={item} /></div>
              <div><span className="mb-1 block text-xs font-medium text-muted">Priority</span><Priority item={item} /></div>
              <div className="col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Due</span><Due item={item} /></div>
              <div className="col-span-2"><span className="mb-1 block text-xs font-medium text-muted">Move to next stage</span>{statusControl(item)}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function WorkListSkeleton() {
  return (
    <div role="status" aria-label="Loading work items">
      <span className="sr-only">Loading work items…</span>
      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <div className="h-11 border-b bg-slate-50" />
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="flex h-16 animate-pulse items-center gap-8 border-b px-4 last:border-0"><span className="h-4 w-2/5 rounded bg-slate-200" /><span className="h-4 w-1/5 rounded bg-slate-200" /><span className="h-6 w-24 rounded-full bg-slate-200" /></div>)}
      </div>
      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-40 animate-pulse rounded-xl border bg-white p-4"><div className="h-5 w-3/4 rounded bg-slate-200" /><div className="mt-7 h-4 w-1/2 rounded bg-slate-200" /><div className="mt-5 h-4 w-2/3 rounded bg-slate-200" /></div>)}
      </div>
    </div>
  );
}
