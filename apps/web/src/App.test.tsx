import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { server } from './mocks/server';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderApp(entry = '/work') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}><App /><LocationProbe /></MemoryRouter></QueryClientProvider>);
}

describe('core browse experience', () => {
  it('loads a URL-backed, paginated work list', async () => {
    renderApp('/work?status=in_progress&pageSize=50');
    expect(await screen.findByRole('heading', { name: 'Team work' })).toBeTruthy();
    expect(await screen.findByText('90 items in this view')).toBeTruthy();
    expect(screen.getByLabelText('Status')).toHaveProperty('value', 'IN_PROGRESS');
    expect(screen.getByTestId('location').textContent).toBe('/work?status=in_progress&pageSize=50');
  });

  it('debounces search into the URL and shows a filtered result', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('360 items in this view');
    await user.type(screen.getByRole('searchbox', { name: 'Search by work item or owner' }), 'onboarding');
    expect(await screen.findByText('1 item in this view')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toContain('search=onboarding');
    expect(screen.getAllByText(/Prepare customer onboarding guide/).length).toBeGreaterThan(0);
  });

  it('applies mobile filter drafts together', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('360 items in this view');
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.selectOptions(screen.getByLabelText('Priority', { selector: '#mobile-priority' }), 'URGENT');
    expect(screen.getByTestId('location').textContent).toBe('/work');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    expect(await screen.findByText('120 items in this view')).toBeTruthy();
    expect(screen.getByTestId('location').textContent).toBe('/work?priority=urgent');
  });

  it('distinguishes filtered-empty and retryable error states', async () => {
    renderApp('/work?search=definitely-not-present');
    expect(await screen.findByRole('heading', { name: 'No work matches this view' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear search and filters' })).toBeTruthy();

    server.use(http.get('http://localhost:4000/api/work-items', () => HttpResponse.json({ error: { message: 'Unavailable' } }, { status: 503 })));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'another' } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy(), { timeout: 1500 });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
