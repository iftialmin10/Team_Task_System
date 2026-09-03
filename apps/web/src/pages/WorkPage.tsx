import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrowseControls } from '../features/work/BrowseControls';
import { Pagination } from '../features/work/Pagination';
import { WorkList, WorkListSkeleton } from '../features/work/WorkList';
import { parseBrowseState, serializeBrowseState, updateBrowseState, type BrowseState } from '../features/work/query-state';
import { getUsers, getWorkItems } from '../services/api';

export function WorkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseBrowseState(searchParams), [searchParams]);
  const canonicalParams = useMemo(() => serializeBrowseState(state), [state]);
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: ({ signal }) => getUsers(signal), staleTime: 5 * 60_000 });
  const workQuery = useQuery({
    queryKey: ['work-items', state],
    queryFn: ({ signal }) => getWorkItems(state, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  useEffect(() => {
    if (searchParams.toString() !== canonicalParams.toString()) setSearchParams(canonicalParams, { replace: true });
  }, [canonicalParams, searchParams, setSearchParams]);

  useEffect(() => {
    const totalPages = workQuery.data?.pagination.totalPages;
    if (totalPages && state.page > totalPages) setSearchParams(serializeBrowseState({ ...state, page: totalPages }), { replace: true });
  }, [setSearchParams, state, workQuery.data?.pagination.totalPages]);

  const changeState = (changes: Partial<BrowseState>, options: { replace?: boolean; resetPage?: boolean } = {}) => {
    setSearchParams(serializeBrowseState(updateBrowseState(state, changes, options.resetPage)), options.replace === undefined ? {} : { replace: options.replace });
  };
  const clearFilters = () => setSearchParams(serializeBrowseState({ ...state, search: undefined, owner: undefined, status: undefined, priority: undefined, due: undefined, page: 1 }));
  const hasNarrowing = Boolean(state.search || state.owner || state.status || state.priority || state.due);
  const pagination = workQuery.data?.pagination;

  return (
    <section aria-labelledby="work-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Shared workspace</p>
          <h1 id="work-heading" className="mt-2 text-[28px] font-bold leading-[34px] tracking-tight">Team work</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-muted">
            {pagination ? `${pagination.totalItems} ${pagination.totalItems === 1 ? 'item' : 'items'} in this view` : 'Find, review, and move the team’s most important work forward.'}
          </p>
        </div>
        <button type="button" disabled aria-describedby="add-work-note" className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-subtle hover:bg-blue-800 active:bg-blue-900">Add work</button>
        <span id="add-work-note" className="sr-only">Adding work will be available in Phase 3.</span>
      </div>

      <BrowseControls state={state} users={usersQuery.data ?? []} onChange={changeState} onClear={clearFilters} />

      <div className="relative mt-5" aria-busy={workQuery.isFetching}>
        {workQuery.isFetching && !workQuery.isPending && <div className="absolute -top-3 right-0 flex items-center gap-2 text-xs font-medium text-muted" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />Updating results…</div>}
        {workQuery.isPending && <WorkListSkeleton />}
        {workQuery.isError && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-8 text-center" role="alert">
            <h2 className="text-lg font-semibold text-red-900">We couldn’t load the work list</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-red-800">Your search and filters are still here. Check the API connection, then try again.</p>
            <button type="button" onClick={() => void workQuery.refetch()} className="mt-5 min-h-11 rounded-lg border border-red-400 bg-white px-4 text-sm font-semibold text-red-900 hover:bg-red-100 active:bg-red-200">Retry</button>
          </div>
        )}
        {workQuery.isSuccess && workQuery.data.data.length > 0 && <WorkList items={workQuery.data.data} />}
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
      <p className="sr-only" aria-live="polite">{workQuery.isSuccess && !workQuery.isFetching ? `${pagination?.totalItems ?? 0} work items loaded.` : ''}</p>
    </section>
  );
}
