/**
 * HTTP client with automatic player ID header injection
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  
  const headers = new Headers(init.headers);
  
  // Attach x-player-id
  const { getPlayerId } = await import('../utils/playerId');
  headers.set('x-player-id', getPlayerId());
  headers.set('content-type', headers.get('content-type') ?? 'application/json');
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(t);
    
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return res.json();
    }
    
    return undefined as T;
  } catch (error) {
    clearTimeout(t);
    throw error;
  }
}
