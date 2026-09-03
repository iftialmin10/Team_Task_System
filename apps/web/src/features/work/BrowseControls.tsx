import { useEffect, useRef, useState } from 'react';
import type { User, WorkItemQuery } from '@team-task-system/contracts';
import type { BrowseState } from './query-state';
import { priorityLabels, statusLabels } from './presentation';

type Props = {
  state: BrowseState;
  users: User[];
  onChange: (changes: Partial<BrowseState>, options?: { replace?: boolean; resetPage?: boolean }) => void;
  onClear: () => void;
};

const selectClass = 'min-h-11 min-w-0 rounded-lg border bg-white px-3 text-sm text-ink hover:border-slate-400 active:bg-slate-50';
const filterKeys = ['owner', 'status', 'priority', 'due'] as const;
const dueLabels = { overdue: 'Overdue', today: 'Due today', upcoming: 'Upcoming', none: 'No due date' } as const;
const sortOptions: Array<{ value: `${WorkItemQuery['sort']}:${WorkItemQuery['order']}`; label: string }> = [
  { value: 'dueDate:asc', label: 'Due date · soonest' },
  { value: 'dueDate:desc', label: 'Due date · latest' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'createdAt:desc', label: 'Recently created' },
  { value: 'title:asc', label: 'Title · A–Z' },
  { value: 'owner:asc', label: 'Owner · A–Z' },
  { value: 'priority:desc', label: 'Priority · highest' },
  { value: 'status:asc', label: 'Status' },
];

function FilterFields({ state, users, onChange, idPrefix = '' }: { state: BrowseState; users: User[]; onChange: (changes: Partial<BrowseState>) => void; idPrefix?: string }) {
  return (
    <>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">Owner
        <select id={`${idPrefix}owner`} className={selectClass} value={state.owner ?? ''} onChange={(event) => onChange({ owner: event.target.value || undefined })}>
          <option value="">All owners</option><option value="unassigned">Unassigned</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">Status
        <select id={`${idPrefix}status`} className={selectClass} value={state.status ?? ''} onChange={(event) => onChange({ status: (event.target.value || undefined) as BrowseState['status'] })}>
          <option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">Priority
        <select id={`${idPrefix}priority`} className={selectClass} value={state.priority ?? ''} onChange={(event) => onChange({ priority: (event.target.value || undefined) as BrowseState['priority'] })}>
          <option value="">All priorities</option>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">Due
        <select id={`${idPrefix}due`} className={selectClass} value={state.due ?? ''} onChange={(event) => onChange({ due: (event.target.value || undefined) as BrowseState['due'] })}>
          <option value="">Any due date</option>{Object.entries(dueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
    </>
  );
}

function SortField({ state, onChange, idPrefix = '' }: { state: BrowseState; onChange: (changes: Partial<BrowseState>) => void; idPrefix?: string }) {
  const value = `${state.sort}:${state.order}`;
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-muted">Sort by
      <select id={`${idPrefix}sort`} className={selectClass} value={value} onChange={(event) => {
        const [sort, order] = event.target.value.split(':') as [BrowseState['sort'], BrowseState['order']];
        onChange({ sort, order });
      }}>
        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function BrowseControls({ state, users, onChange, onClear }: Props) {
  const [search, setSearch] = useState(state.search ?? '');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(state);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const activeCount = filterKeys.filter((key) => state[key] !== undefined).length;

  useEffect(() => {
    if (searchTimer.current === undefined) setSearch(state.search ?? '');
  }, [state.search]);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  useEffect(() => {
    if (!filtersOpen) return;
    closeButton.current?.focus();
    const focusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setFiltersOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const controls = focusable();
      if (!controls.length) return;
      const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0 ? controls.length - 1 : currentIndex - 1
        : currentIndex === -1 ? 0 : currentIndex === controls.length - 1 ? 0 : currentIndex + 1;
      event.preventDefault();
      controls[nextIndex]?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

  const changeSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchTimer.current = undefined;
      onChange({ search: value.trim() || undefined }, { replace: true, resetPage: true });
    }, 300);
  };

  const openFilters = () => { setDraft(state); setFiltersOpen(true); };
  return (
    <div className="mt-7">
      <div className="flex gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search by work item or owner</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">⌕</span>
          <input id="work-search" type="search" value={search} onChange={(event) => changeSearch(event.target.value)} placeholder="Search work or owner…" className="min-h-11 w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-sm shadow-subtle placeholder:text-slate-400 hover:border-slate-400" />
        </label>
        <button type="button" onClick={openFilters} className="min-h-11 shrink-0 rounded-lg border bg-white px-4 text-sm font-semibold shadow-subtle hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 md:hidden">
          Filters{activeCount > 0 && <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-blue-100 px-1.5 text-xs text-blue-800">{activeCount}</span>}
        </button>
      </div>

      <div className="mt-4 hidden grid-cols-5 gap-3 md:grid">
        <FilterFields state={state} users={users} onChange={(changes) => onChange(changes, { resetPage: true })} />
        <SortField state={state} onChange={(changes) => onChange(changes)} />
      </div>

      <ActiveFilters state={state} users={users} onRemove={(key) => onChange({ [key]: undefined }, { resetPage: true })} onClear={onClear} />

      {filtersOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-slate-950/45 md:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
          <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="filters-heading" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-overlay">
            <div className="flex items-center justify-between">
              <h2 id="filters-heading" className="text-xl font-semibold">Filter and sort</h2>
              <button ref={closeButton} type="button" onClick={() => setFiltersOpen(false)} className="min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-slate-100 active:bg-slate-200">Close</button>
            </div>
            <div className="mt-5 grid gap-4">
              <FilterFields idPrefix="mobile-" state={draft} users={users} onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))} />
              <SortField idPrefix="mobile-" state={draft} onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))} />
            </div>
            <div className="sticky bottom-0 mt-6 flex gap-3 border-t bg-white pt-4">
              <button type="button" onClick={() => setDraft((current) => ({ ...current, owner: undefined, status: undefined, priority: undefined, due: undefined }))} className="min-h-11 flex-1 rounded-lg border px-4 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100">Reset</button>
              <button type="button" onClick={() => { onChange({ owner: draft.owner, status: draft.status, priority: draft.priority, due: draft.due, sort: draft.sort, order: draft.order }, { resetPage: true }); setFiltersOpen(false); }} className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-blue-800 active:bg-blue-900">Apply filters</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ActiveFilters({ state, users, onRemove, onClear }: { state: BrowseState; users: User[]; onRemove: (key: 'search' | typeof filterKeys[number]) => void; onClear: () => void }) {
  const filters: Array<{ key: 'search' | typeof filterKeys[number]; label: string }> = [];
  if (state.search) filters.push({ key: 'search', label: `Search: ${state.search}` });
  if (state.owner) filters.push({ key: 'owner', label: state.owner === 'unassigned' ? 'Owner: Unassigned' : `Owner: ${users.find(({ id }) => id === state.owner)?.name ?? state.owner}` });
  if (state.status) filters.push({ key: 'status', label: `Status: ${statusLabels[state.status]}` });
  if (state.priority) filters.push({ key: 'priority', label: `Priority: ${priorityLabels[state.priority]}` });
  if (state.due) filters.push({ key: 'due', label: `Due: ${dueLabels[state.due]}` });
  if (filters.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
      {filters.map((filter) => <button key={filter.key} type="button" onClick={() => onRemove(filter.key)} className="min-h-9 max-w-full rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-900 hover:border-blue-400 hover:bg-blue-100 active:bg-blue-200"><span className="inline-block max-w-[16rem] truncate align-bottom">{filter.label}</span><span className="ml-2" aria-hidden="true">×</span><span className="sr-only">Remove {filter.label}</span></button>)}
      <button type="button" onClick={onClear} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 active:bg-blue-100">Clear all</button>
    </div>
  );
}
