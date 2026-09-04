import { PRIORITIES, WORK_STATUSES, type Priority, type WorkItem, type WorkStatus } from '@team-task-system/contracts';
import { getDuePresentation, priorityClasses, priorityLabels, statusClasses, statusLabels } from './presentation';

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

export function WorkList({ items, onOpen, onStatus, onPriority, pendingStatusId, pendingPriorityId, failedStatusId, failedPriorityId, onRetryStatus, onRetryPriority }: {
  items: WorkItem[];
  onOpen: (id: string) => void;
  onStatus: (item: WorkItem, status: WorkStatus) => void;
  onPriority: (item: WorkItem, priority: Priority) => void;
  pendingStatusId: string | undefined;
  pendingPriorityId: string | undefined;
  failedStatusId: string | undefined;
  failedPriorityId: string | undefined;
  onRetryStatus: () => void;
  onRetryPriority: () => void;
}) {
  const statusControl = (item: WorkItem) => (
    <div className="min-w-0">
      <select
        value={item.status}
        disabled={pendingStatusId === item.id || pendingPriorityId === item.id}
        onChange={(event) => onStatus(item, event.target.value as WorkStatus)}
        aria-label={`Change status for ${item.title}`}
        className={`min-h-11 w-full min-w-0 rounded-lg border px-2 text-xs font-semibold hover:brightness-95 disabled:cursor-wait disabled:opacity-70 sm:px-2.5 ${statusClasses[item.status]}`}
      >
        {WORK_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </select>
      {failedStatusId === item.id && <div className="mt-1 text-xs text-red-700" role="alert">Update failed. <button type="button" onClick={onRetryStatus} className="min-h-11 rounded px-1 font-semibold underline">Retry</button></div>}
    </div>
  );
  const priorityControl = (item: WorkItem) => (
    <div className="min-w-0">
      <select
        value={item.priority}
        disabled={pendingStatusId === item.id || pendingPriorityId === item.id}
        onChange={(event) => onPriority(item, event.target.value as Priority)}
        aria-label={`Change priority for ${item.title}`}
        className={`min-h-11 w-full min-w-0 rounded-lg border px-2 text-xs font-semibold hover:brightness-95 disabled:cursor-wait disabled:opacity-70 sm:px-2.5 ${priorityClasses[item.priority]}`}
      >
        {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
      </select>
      {failedPriorityId === item.id && <div className="mt-1 text-xs text-red-700" role="alert">Priority update failed. <button type="button" onClick={onRetryPriority} className="min-h-11 rounded px-1 font-semibold underline">Retry</button></div>}
    </div>
  );
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-white shadow-subtle md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">Team work items</caption>
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="w-[27%] px-3 py-3 lg:w-[30%] lg:px-4 xl:w-[26%]">Work item</th>
              <th scope="col" className="w-[18%] px-3 py-3 lg:px-4 xl:w-[16%]">Owner</th>
              <th scope="col" className="w-[19%] px-2 py-3 lg:w-[16%] lg:px-4 xl:w-[14%]">Status</th>
              <th scope="col" className="w-[17%] px-2 py-3 lg:w-[15%] lg:px-4 xl:w-[12%]">Priority</th>
              <th scope="col" className="w-[19%] px-3 py-3 lg:w-[21%] lg:px-4 xl:w-[14%]">Due</th>
              <th scope="col" className="hidden w-[18%] px-4 py-3 xl:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="min-h-14 hover:bg-slate-50">
                <th scope="row" className="px-3 py-3 font-semibold lg:px-4">
                  <button type="button" onClick={() => onOpen(item.id)} className="block min-h-11 w-full truncate rounded-md text-left text-primary underline-offset-2 hover:underline active:text-blue-900" title={item.title}>{item.title}</button>
                </th>
                <td className="px-3 py-3 lg:px-4"><Owner item={item} /></td>
                <td className="px-2 py-3 lg:px-4">{statusControl(item)}</td>
                <td className="px-2 py-3 lg:px-4">{priorityControl(item)}</td>
                <td className="px-3 py-3 lg:px-4"><Due item={item} /></td>
                <td className="hidden px-4 py-3 text-muted xl:table-cell"><time dateTime={item.updatedAt}>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.updatedAt))}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 md:hidden" aria-label="Team work items">
        {items.map((item) => (
          <li key={item.id} className="min-w-0 rounded-xl border bg-white p-4 shadow-subtle">
            <h2 className="min-w-0 text-base font-semibold leading-6"><button type="button" onClick={() => onOpen(item.id)} className="min-h-11 max-w-full text-left text-primary [overflow-wrap:anywhere] underline-offset-2 hover:underline active:text-blue-900" title={item.title}>{item.title}</button></h2>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
              <div className="min-w-0"><span className="mb-1 block text-xs font-medium text-muted">Status</span>{statusControl(item)}</div>
              <div className="min-w-0"><span className="mb-1 block text-xs font-medium text-muted">Priority</span>{priorityControl(item)}</div>
              <div className="min-w-0"><span className="mb-1 block text-xs font-medium text-muted">Owner</span><Owner item={item} /></div>
              <div className="min-w-0"><span className="mb-1 block text-xs font-medium text-muted">Due</span><Due item={item} /></div>
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
