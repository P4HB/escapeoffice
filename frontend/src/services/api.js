let csrfToken;
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  if (method !== 'GET' && !csrfToken) {
    const session = await apiRequest('/session', { signal });
    csrfToken = session.csrf_token;
  }
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-CSRF-Token': csrfToken } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (data.csrf_token) csrfToken = data.csrf_token;
  if (!response.ok) {
    if (response.status === 403) csrfToken = undefined;
    throw new Error(data.error || '요청을 처리하지 못했습니다.');
  }
  return data;
}
