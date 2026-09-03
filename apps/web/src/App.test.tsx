import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('application shell', () => {
  it('routes to work and confirms the API connection', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/']}><App /></MemoryRouter></QueryClientProvider>);
    expect(await screen.findByRole('heading', { name: 'Team work' })).toBeTruthy();
    expect(await screen.findByText('The application shell is connected to the API.')).toBeTruthy();
  });
});
