import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../services/api';

export function WorkPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth, retry: 1 });
  return (
    <section aria-labelledby="work-heading">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Shared workspace</p>
          <h1 id="work-heading" className="mt-2 text-[28px] font-bold leading-[34px] tracking-tight">Team work</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-muted">Find, review, and move the team’s most important work forward.</p>
        </div>
        <button type="button" disabled className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-subtle hover:bg-blue-800 active:bg-blue-900">
          Add work <span className="sr-only">(available in Phase 3)</span>
        </button>
      </div>
      <div className="mt-8 rounded-xl border bg-white p-6 shadow-subtle sm:p-8">
        <div className="flex items-start gap-4">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${health.isSuccess ? 'bg-green-600' : health.isError ? 'bg-red-700' : 'animate-pulse bg-slate-400'}`} aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold leading-7">Foundation ready</h2>
            <p className="mt-2 text-sm leading-5 text-muted" role="status">
              {health.isPending && 'Checking the API connection…'}
              {health.isSuccess && 'The application shell is connected to the API.'}
              {health.isError && 'The shell is ready, but the API could not be reached. Start the API and retry.'}
            </p>
            {health.isError && <button type="button" onClick={() => void health.refetch()} className="mt-4 min-h-11 rounded-lg border px-4 text-sm font-semibold hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100">Retry connection</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
