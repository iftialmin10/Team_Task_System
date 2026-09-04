import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Priority, WorkItem, WorkItemListResponse, WorkStatus } from '@team-task-system/contracts';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BrowseControls } from '../features/work/BrowseControls';
import { Pagination } from '../features/work/Pagination';
import { WorkList, WorkListSkeleton } from '../features/work/WorkList';
import { CreateWorkDialog } from '../features/work/CreateWorkDialog';
import { WorkItemDetails } from '../features/work/WorkItemDetails';
import { parseBrowseState, serializeBrowseState, updateBrowseState, type BrowseState } from '../features/work/query-state';
import { getUsers, getWorkItems, updateWorkItem, updateWorkItemStatus } from '../services/api';

export function WorkPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const state = useMemo(() => parseBrowseState(searchParams), [searchParams]);
  const selectedId = searchParams.get('item')?.trim().slice(0, 64) || undefined;
  const canonicalParams = useMemo(() => {
    const params = serializeBrowseState(state);
    if (selectedId) params.set('item', selectedId);
    return params;
  }, [selectedId, state]);
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: ({ signal }) => getUsers(signal), staleTime: 5 * 60_000 });
  const workQuery = useQuery({
    queryKey: ['work-items', state],
    queryFn: ({ signal }) => getWorkItems(state, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  });
  const statusMutation = useMutation({
    mutationFn: ({ item, status }: { item: WorkItem; status: WorkStatus }) => updateWorkItemStatus(item.id, status),
    onMutate: async ({ item, status }) => {
      setAnnouncement(`Moving ${item.title} to ${status.toLowerCase().replace('_', ' ')}.`);
      await queryClient.cancelQueries({ queryKey: ['work-items'] });
      const lists = queryClient.getQueriesData<WorkItemListResponse>({ queryKey: ['work-items'] });
      const detail = queryClient.getQueryData<WorkItem>(['work-item', item.id]);
      const optimistic = { ...item, status, updatedAt: new Date().toISOString() };
      queryClient.setQueriesData<WorkItemListResponse>({ queryKey: ['work-items'] }, (current) => current ? { ...current, data: current.data.map((entry) => entry.id === item.id ? optimistic : entry) } : current);
      if (detail) queryClient.setQueryData(['work-item', item.id], { ...detail, status, updatedAt: optimistic.updatedAt });
      return { lists, detail };
    },
    onError: (_error, { item }, context) => {
      context?.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.detail) queryClient.setQueryData(['work-item', item.id], context.detail);
      setAnnouncement(`Could not update ${item.title}. The previous status was restored.`);
    },
    onSuccess: (item) => { queryClient.setQueryData(['work-item', item.id], item); setAnnouncement(`${item.title} moved to ${item.status.toLowerCase().replace('_', ' ')}.`); },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  });
  const priorityMutation = useMutation({
    mutationFn: ({ item, priority }: { item: WorkItem; priority: Priority }) => updateWorkItem(item.id, { priority }),
    onMutate: async ({ item, priority }) => {
      setAnnouncement(`Changing ${item.title} priority to ${priority.toLowerCase()}.`);
      await queryClient.cancelQueries({ queryKey: ['work-items'] });
      const lists = queryClient.getQueriesData<WorkItemListResponse>({ queryKey: ['work-items'] });
      const detail = queryClient.getQueryData<WorkItem>(['work-item', item.id]);
      const optimistic = { ...item, priority, updatedAt: new Date().toISOString() };
      queryClient.setQueriesData<WorkItemListResponse>({ queryKey: ['work-items'] }, (current) => current ? { ...current, data: current.data.map((entry) => entry.id === item.id ? optimistic : entry) } : current);
      if (detail) queryClient.setQueryData(['work-item', item.id], { ...detail, priority, updatedAt: optimistic.updatedAt });
      return { lists, detail };
    },
    onError: (_error, { item }, context) => {
      context?.lists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.detail) queryClient.setQueryData(['work-item', item.id], context.detail);
      setAnnouncement(`Could not update ${item.title}. The previous priority was restored.`);
    },
    onSuccess: (item) => { queryClient.setQueryData(['work-item', item.id], item); setAnnouncement(`${item.title} priority changed to ${item.priority.toLowerCase()}.`); },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  });

  useEffect(() => {
    if (searchParams.toString() !== canonicalParams.toString()) setSearchParams(canonicalParams, { replace: true });
  }, [canonicalParams, searchParams, setSearchParams]);

  useEffect(() => {
    const totalPages = workQuery.data?.pagination.totalPages;
    if (totalPages && state.page > totalPages) setSearchParams(serializeBrowseState({ ...state, page: totalPages }), { replace: true });
  }, [setSearchParams, state, workQuery.data?.pagination.totalPages]);

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = window.setTimeout(() => setShareStatus(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  const changeState = (changes: Partial<BrowseState>, options: { replace?: boolean; resetPage?: boolean } = {}) => {
    const params = serializeBrowseState(updateBrowseState(state, changes, options.resetPage));
    if (selectedId) params.set('item', selectedId);
    setSearchParams(params, options.replace === undefined ? {} : { replace: options.replace });
  };
  const clearFilters = () => setSearchParams(serializeBrowseState({ ...state, search: undefined, owner: undefined, status: undefined, priority: undefined, due: undefined, page: 1 }));
  const hasNarrowing = Boolean(state.search || state.owner || state.status || state.priority || state.due);
  const pagination = workQuery.data?.pagination;
  const openItem = (id: string) => { const params = new URLSearchParams(canonicalParams); params.set('item', id); setSearchParams(params); };
  const closeItem = () => { const params = new URLSearchParams(canonicalParams); params.delete('item'); setSearchParams(params); };
  const shareView = async () => {
    const params = serializeBrowseState(state).toString();
    const shareUrl = new URL(`${location.pathname}${params ? `?${params}` : ''}`, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Link copied');
    } catch {
      setShareStatus('Could not copy the link. Please try again.');
    }
  };

  return (
    <section aria-labelledby="work-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Shared workspace</p>
          <h1 id="work-heading" className="mt-2 text-[28px] font-bold leading-[34px] tracking-tight">Team work</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-muted">
            Find, review, and move the team’s most important work forward.
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-subtle hover:bg-blue-800 active:bg-blue-900">Add work</button>
      </div>

      <BrowseControls state={state} users={usersQuery.data ?? []} onChange={changeState} onClear={clearFilters} />

      <div className="mt-5 flex min-h-11 items-center justify-end">
        <button
          type="button"
          onClick={() => void shareView()}
          className="min-h-11 rounded-lg border bg-white px-4 text-sm font-semibold text-ink shadow-subtle hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
        >
          Share With Colleagues
        </button>
      </div>

      {shareStatus && (
        <div
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
          role="status"
          aria-live="polite"
        >
          {shareStatus}
        </div>
      )}

      <div className="relative mt-3" aria-busy={workQuery.isFetching}>
        {workQuery.isFetching && !workQuery.isPending && <div className="absolute -top-3 right-0 flex items-center gap-2 text-xs font-medium text-muted" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />Updating results…</div>}
        {workQuery.isPending && <WorkListSkeleton />}
        {workQuery.isError && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-8 text-center" role="alert">
            <h2 className="text-lg font-semibold text-red-900">We couldn’t load the work list</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-red-800">Your search and filters are still here. Check the API connection, then try again.</p>
            <button type="button" onClick={() => void workQuery.refetch()} className="mt-5 min-h-11 rounded-lg border border-red-400 bg-white px-4 text-sm font-semibold text-red-900 hover:bg-red-100 active:bg-red-200">Retry</button>
          </div>
        )}
        {workQuery.isSuccess && workQuery.data.data.length > 0 && <WorkList items={workQuery.data.data} onOpen={openItem} onStatus={(item, status) => { statusMutation.reset(); statusMutation.mutate({ item, status }); }} onPriority={(item, priority) => { priorityMutation.reset(); priorityMutation.mutate({ item, priority }); }} pendingStatusId={statusMutation.isPending ? statusMutation.variables?.item.id : undefined} pendingPriorityId={priorityMutation.isPending ? priorityMutation.variables?.item.id : undefined} failedStatusId={statusMutation.isError ? statusMutation.variables?.item.id : undefined} failedPriorityId={priorityMutation.isError ? priorityMutation.variables?.item.id : undefined} onRetryStatus={() => { if (statusMutation.variables) statusMutation.mutate(statusMutation.variables); }} onRetryPriority={() => { if (priorityMutation.variables) priorityMutation.mutate(priorityMutation.variables); }} />}
        {workQuery.isSuccess && workQuery.data.data.length === 0 && (
          <div className="rounded-xl border bg-white px-5 py-12 text-center shadow-subtle">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl" aria-hidden="true">{hasNarrowing ? '⌕' : '＋'}</div>
            <h2 className="mt-4 text-lg font-semibold">{hasNarrowing ? 'No work matches this view' : 'No work has been added yet'}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-muted">{hasNarrowing ? 'Try removing a filter or broadening your search to see more work.' : 'When your team adds its first work item, it will appear here.'}</p>
            {hasNarrowing && <button type="button" onClick={clearFilters} className="mt-5 min-h-11 rounded-lg border px-4 text-sm font-semibold hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100">Clear search and filters</button>}
          </div>
        )}
      </div>

      {pagination && <Pagination {...pagination} onPage={(page) => changeState({ page })} onPageSize={(pageSize) => changeState({ pageSize }, { resetPage: true })} />}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{workQuery.isSuccess && !workQuery.isFetching ? `${pagination?.totalItems ?? 0} work items loaded.` : ''}</p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      {creating && <CreateWorkDialog users={usersQuery.data ?? []} onClose={() => setCreating(false)} onCreated={(item) => { setCreating(false); setAnnouncement(`${item.title} was added to the backlog.`); }} />}
      {selectedId && <WorkItemDetails id={selectedId} users={usersQuery.data ?? []} onClose={closeItem} onSaved={(item) => setAnnouncement(`${item.title} was updated.`)} onStatus={(item, status) => { statusMutation.reset(); statusMutation.mutate({ item, status }); }} statusPending={statusMutation.isPending && statusMutation.variables?.item.id === selectedId} statusError={statusMutation.isError && statusMutation.variables?.item.id === selectedId} onRetryStatus={() => { if (statusMutation.variables) statusMutation.mutate(statusMutation.variables); }} />}
    </section>
  );
}
