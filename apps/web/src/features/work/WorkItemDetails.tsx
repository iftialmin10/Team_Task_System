import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WORK_STATUSES, type CreateWorkItemInput, type User, type WorkItem, type WorkStatus } from '@team-task-system/contracts';
import { useState } from 'react';
import { getWorkItem, updateWorkItem } from '../../services/api';
import { DialogShell } from './DialogShell';
import { getDuePresentation, priorityLabels, statusLabels } from './presentation';
import { WorkItemForm } from './WorkItemForm';

export function WorkItemDetails({ id, users, onClose, onSaved, onStatus, statusPending, statusError, onRetryStatus }: { id: string; users: User[]; onClose: () => void; onSaved: (item: WorkItem) => void; onStatus: (item: WorkItem, status: WorkStatus) => void; statusPending: boolean; statusError: boolean; onRetryStatus: () => void }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['work-item', id], queryFn: ({ signal }) => getWorkItem(id, signal), retry: 1 });
  const mutation = useMutation({
    mutationFn: (input: CreateWorkItemInput) => updateWorkItem(id, input),
    onSuccess: async (item) => {
      queryClient.setQueryData(['work-item', id], item);
      await queryClient.invalidateQueries({ queryKey: ['work-items'] });
      setEditing(false);
      onSaved(item);
    },
  });
  const title = query.data?.title ?? 'Work item details';

  return (
    <DialogShell titleId="work-details-title" descriptionId="work-details-description" onClose={onClose}>
      <div className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Work item</p><h2 id="work-details-title" className="mt-1 break-words text-xl font-bold">{title}</h2><p id="work-details-description" className="sr-only">Inspect and edit this work item.</p></div><button type="button" onClick={onClose} aria-label="Close work item details" className="min-h-11 min-w-11 rounded-lg text-xl hover:bg-slate-100 active:bg-slate-200">×</button></div>
      {query.isPending && <div className="space-y-4 px-6 py-8" role="status"><span className="sr-only">Loading work item…</span><div className="h-5 w-2/3 animate-pulse rounded bg-slate-200"/><div className="h-20 animate-pulse rounded bg-slate-100"/></div>}
      {query.isError && <div className="m-5 rounded-lg border border-red-300 bg-red-50 p-5 text-red-800" role="alert"><p className="font-semibold">We couldn’t load this work item.</p><p className="mt-1 text-sm">{query.error.message}</p><button type="button" onClick={() => void query.refetch()} className="mt-4 min-h-11 rounded-lg border border-red-400 bg-white px-4 text-sm font-semibold hover:bg-red-100">Retry</button></div>}
      {query.data && editing && <WorkItemForm key={query.data.updatedAt} item={query.data} users={users} submitLabel="Save changes" pending={mutation.isPending} error={mutation.error?.message} onCancel={() => { mutation.reset(); setEditing(false); }} onSubmit={(input) => mutation.mutate(input)} />}
      {query.data && !editing && <div><dl className="grid gap-5 px-5 py-6 text-sm sm:grid-cols-2 sm:px-6"><div><dt className="font-semibold text-muted">Status</dt><dd className="mt-1"><label className="sr-only" htmlFor="details-status">Status for this work item</label><select id="details-status" value={query.data.status} disabled={statusPending} onChange={(event) => onStatus(query.data!, event.target.value as WorkStatus)} className="min-h-11 rounded-lg border bg-white px-3 font-semibold">{WORK_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select>{statusError && <div className="mt-1 text-xs text-red-700" role="alert">Update failed. <button type="button" onClick={onRetryStatus} className="font-semibold underline">Retry</button></div>}</dd></div><div><dt className="font-semibold text-muted">Priority</dt><dd className="mt-1">{priorityLabels[query.data.priority]}</dd></div><div><dt className="font-semibold text-muted">Owner</dt><dd className="mt-1">{query.data.owner?.name ?? 'Unassigned'}</dd></div><div><dt className="font-semibold text-muted">Due</dt><dd className="mt-1">{getDuePresentation(query.data).label}</dd></div><div className="sm:col-span-2"><dt className="font-semibold text-muted">Description</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{query.data.description || 'No description provided.'}</dd></div></dl><div className="flex justify-end gap-3 border-t px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50">Close</button><button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-800">Edit work</button></div></div>}
    </DialogShell>
  );
}
