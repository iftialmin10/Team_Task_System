type Props = { page: number; pageSize: number; totalItems: number; totalPages: number; onPage: (page: number) => void; onPageSize: (size: 25 | 50) => void };

export function Pagination({ page, pageSize, totalItems, totalPages, onPage, onPageSize }: Props) {
  if (totalItems === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  return (
    <nav className="mt-5 flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-subtle sm:flex-row sm:items-center sm:justify-between" aria-label="Work item pages">
      <p className="text-muted"><span className="font-semibold text-ink">{first}–{last}</span> of <span className="font-semibold text-ink">{totalItems}</span></p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <label className="flex items-center gap-2 text-muted">Per page
          <select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value) as 25 | 50)} className="min-h-11 rounded-lg border bg-white px-2 text-ink hover:border-slate-400">
            <option value="25">25</option><option value="50">50</option>
          </select>
        </label>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 rounded-lg border px-3 font-semibold hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100">Previous</button>
        <span className="whitespace-nowrap tabular-nums" aria-current="page">{page} / {Math.max(totalPages, 1)}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="min-h-11 rounded-lg border px-3 font-semibold hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100">Next</button>
      </div>
    </nav>
  );
}

