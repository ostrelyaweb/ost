const storageKey = 'ostrelya-studio-session';
let memoryToken = '';

export function setStudioSession(token = '') {
  try {
    if (token) localStorage.setItem(storageKey, token);
    else localStorage.removeItem(storageKey);
  } catch {
    memoryToken = token;
  }
}

export function studioFetch(path, options = {}) {
  let token = memoryToken;
  try { token = localStorage.getItem(storageKey); } catch { /* Storage may be blocked. */ }
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', 'Bearer ' + token);
  return fetch('/api/studio/' + path, {
    ...options, headers, cache: 'no-store', credentials: 'omit', mode: 'same-origin', redirect: 'error'
  });
}

const pendingImages = new WeakMap();

export async function loadStudioImage(image, name) {
  const request = new AbortController();
  pendingImages.get(image)?.abort();
  pendingImages.set(image, request);
  let url;
  try {
    const response = await studioFetch('media/' + encodeURIComponent(name), { signal: request.signal });
    if (!response.ok) throw new Error('Image unavailable');
    const blob = await response.blob();
    if (request.signal.aborted || !image.isConnected) return;
    url = URL.createObjectURL(blob);
    image.src = url;
    await image.decode();
  } catch {
    if (!request.signal.aborted) image.hidden = true;
  } finally {
    if (url) URL.revokeObjectURL(url);
    if (pendingImages.get(image) === request) pendingImages.delete(image);
  }
}
