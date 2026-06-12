const BASE = 'http://localhost:3001';

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { status: res.status });
  }
  // 204 / empty body
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const getCurrentUser = ()                     => request('GET',    '/api/sessions/current');
export const login          = (username, password)   => request('POST',   '/api/sessions', { username, password });
export const logout         = ()                     => request('DELETE', '/api/sessions/current');

export const getFullNetwork = ()                     => request('GET',    '/api/network/full');
export const getSegments    = ()                     => request('GET',    '/api/network/segments');

export const startGame      = ()                     => request('POST',   '/api/games', {});
export const submitRoute    = (gameId, segments)     => request('POST',   `/api/games/${gameId}/submit-route`, { segments });

export const getRanking     = ()                     => request('GET',    '/api/ranking');
