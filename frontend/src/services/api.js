const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.details?.join(' ') || payload.error || 'No se pudo completar la solicitud.');
  return payload.data;
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
