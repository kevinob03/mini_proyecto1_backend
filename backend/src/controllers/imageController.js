const cache = new Map();
const requestsByIp = new Map();
const downloadLocations = new Map();
const upstreamRequests = [];
const CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;
const MAX_CACHE_ITEMS = 100;

function allowUpstreamRequest() {
  const now = Date.now();
  while (upstreamRequests.length && now - upstreamRequests[0] >= 60 * 60 * 1000) upstreamRequests.shift();
  const configured = Number(process.env.UNSPLASH_HOURLY_LIMIT || 45);
  const limit = Number.isInteger(configured) ? Math.min(45, Math.max(1, configured)) : 45;
  if (upstreamRequests.length >= limit) return false;
  upstreamRequests.push(now);
  return true;
}

function allowRequest(ip) {
  const now = Date.now();
  const history = (requestsByIp.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (history.length >= MAX_REQUESTS_PER_WINDOW) {
    requestsByIp.set(ip, history);
    return false;
  }
  history.push(now);
  requestsByIp.set(ip, history);
  return true;
}

function withAttributionParams(value) {
  try {
    const url = new URL(value);
    if (url.hostname === 'unsplash.com' || url.hostname.endsWith('.unsplash.com')) {
      url.searchParams.set('utm_source', 'noir_inventory');
      url.searchParams.set('utm_medium', 'referral');
    }
    return url.toString();
  } catch { return 'https://unsplash.com/?utm_source=noir_inventory&utm_medium=referral'; }
}

export async function searchImages(req, res) {
  if (!allowRequest(req.ip)) return res.status(429).json({ error: 'Demasiadas búsquedas. Espera un momento e inténtalo de nuevo.' });
  const query = String(req.query.query || '').trim().slice(0, 80);
  const page = Number(req.query.page || 1);
  if (query.length < 2) return res.status(400).json({ error: 'Escribe al menos dos caracteres para buscar.' });
  if (!Number.isInteger(page) || page < 1 || page > 5) return res.status(400).json({ error: 'La página debe estar entre 1 y 5.' });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return res.status(503).json({ error: 'La búsqueda Unsplash no está configurada. Puedes ingresar una URL propia segura.' });

  const cacheKey = `${query.toLowerCase()}|${page}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.json({ data: cached.data, cached: true });
  if (!allowUpstreamRequest()) return res.status(429).json({ error: 'Se alcanzó el límite local de consultas a Unsplash por hora. Prueba más tarde.' });

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.search = new URLSearchParams({ query, page: String(page), per_page: '12', content_filter: 'high', order_by: 'relevant' }).toString();
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const status = response.status === 429 ? 503 : 502;
      return res.status(status).json({ error: response.status === 429 ? 'Unsplash alcanzó su límite temporal de solicitudes.' : 'No fue posible buscar imágenes en Unsplash.' });
    }
    const payload = await response.json();
    const data = (payload.results || []).map((photo) => ({
      id: photo.id,
      url: photo.urls?.regular || photo.urls?.small,
      alt: photo.alt_description || photo.description || 'Fotografía editorial de moda',
      author: photo.user?.name || photo.user?.username || 'Fotógrafo de Unsplash',
      authorUrl: withAttributionParams(photo.user?.links?.html),
      creditUrl: withAttributionParams(photo.links?.html),
      source: 'Unsplash',
    })).filter((photo) => photo.url);
    for (const photo of payload.results || []) {
      if (photo.id && photo.links?.download_location) downloadLocations.set(photo.id, photo.links.download_location);
    }
    while (downloadLocations.size > 400) downloadLocations.delete(downloadLocations.keys().next().value);
    if (cache.size >= MAX_CACHE_ITEMS) cache.delete(cache.keys().next().value);
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    for (const [key, value] of requestsByIp) if (!value.some((time) => Date.now() - time < RATE_WINDOW_MS)) requestsByIp.delete(key);
    return res.json({ data, cached: false });
  } catch {
    return res.status(502).json({ error: 'No fue posible conectar con Unsplash. Puedes ingresar una URL propia segura.' });
  }
}

export async function trackImageSelection(req, res) {
  if (!allowRequest(req.ip)) return res.status(429).json({ error: 'Demasiadas solicitudes de imagen. Espera un momento e inténtalo de nuevo.' });
  const photoId = String(req.body?.photoId || '');
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(photoId)) return res.status(400).json({ error: 'Identificador de foto inválido.' });
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return res.status(503).json({ error: 'La integración Unsplash no está configurada.' });
  const downloadLocation = downloadLocations.get(photoId);
  if (!downloadLocation) return res.status(400).json({ error: 'Vuelve a buscar y selecciona una foto válida de Unsplash.' });
  if (!allowUpstreamRequest()) return res.status(429).json({ error: 'Se alcanzó el límite local de consultas a Unsplash por hora. Prueba más tarde.' });
  try {
    const downloadUrl = new URL(downloadLocation);
    if (downloadUrl.origin !== 'https://api.unsplash.com' || !/^\/photos\/[A-Za-z0-9_-]+\/download$/.test(downloadUrl.pathname)) {
      return res.status(400).json({ error: 'La referencia de descarga de la foto no es válida.' });
    }
    const response = await fetch(downloadUrl, {
      headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return res.status(502).json({ error: 'No fue posible registrar la selección de la foto en Unsplash.' });
    return res.json({ data: { tracked: true } });
  } catch {
    return res.status(502).json({ error: 'No fue posible conectar con Unsplash para registrar la selección.' });
  }
}
