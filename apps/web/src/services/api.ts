const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error('The API is unavailable');
  return response.json() as Promise<{ status: string }>;
}
