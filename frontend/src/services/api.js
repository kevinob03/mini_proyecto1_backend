const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const TOKEN_KEY = 'noir_access_token';

export class ApiError extends Error {
  constructor(message, status, payload = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.delivery = payload.delivery;
    this.intentosRestantes = payload.intentosRestantes;
    this.retryAfter = payload.retryAfter;
  }
}

export async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? window.sessionStorage.getItem(TOKEN_KEY) : null;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && typeof window !== 'undefined') {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('noir:unauthorized'));
  }
  if (!response.ok) throw new ApiError(payload.details?.join(' ') || payload.error || 'No se pudo completar la solicitud.', response.status, payload);
  return payload.data ?? payload;
}

export const api = {
  list: (resource) => request(`/${resource}`),
  create: (resource, data) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
};

export async function searchImages(query) {
  const params = new URLSearchParams({ query });
  return request(`/imagenes/buscar?${params}`);
}

export async function trackImageSelection(photoId) {
  return request('/imagenes/seleccionar', { method: 'POST', body: JSON.stringify({ photoId }) });
}

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyUnlock: (data) => request('/auth/verify-unlock', { method: 'POST', body: JSON.stringify(data) }),
  resendUnlock: (data) => request('/auth/resend-unlock', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  skipPasswordReset: (data) => request('/auth/skip-password-reset', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
};
