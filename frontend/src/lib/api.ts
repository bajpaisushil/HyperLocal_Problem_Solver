import { API_URL } from './constants';

const TOKEN_KEY = 'nf_token';

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = opts;
  const init: RequestInit = { method, headers: { ...headers } };
  const h = init.headers as Record<string, string>;

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (auth) {
    const token = tokenStore.get();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, init);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && (data as { message?: string })?.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const mediaUrl = (p?: string) => (p && p.startsWith('/uploads') ? `${API_URL}${p}` : p || '');
