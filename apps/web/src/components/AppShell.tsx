import { Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="border-b bg-white shadow-subtle">
        <div className="mx-auto flex min-h-16 max-w-content items-center px-4 sm:px-6 lg:px-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white" aria-hidden="true">TT</span>
          <span className="ml-3 text-base font-semibold tracking-tight">Team Tasks System</span>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
