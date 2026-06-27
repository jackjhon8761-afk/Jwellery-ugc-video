// Every call here hits our own Express backend (proxied at /api in dev,
// same-origin in production) — the browser never talks to Creatify, OpenAI,
// or Instagram directly.

async function request(path, options = {}) {
  const res = await fetch(path, options);
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const data = await request('/api/upload', { method: 'POST', body: formData });
  return data.url;
}

export async function startVideoGeneration(imageUrl) {
  const data = await request('/api/videos/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });
  return data.jobId;
}

export async function getVideoJobStatus(jobId) {
  return request(`/api/videos/status/${jobId}`);
}

export async function generateCaption(imageUrl, notes) {
  const data = await request('/api/caption/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, notes }),
  });
  return data.caption;
}

export async function publishToInstagram(videoUrl, caption) {
  return request('/api/instagram/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, caption }),
  });
}

export function downloadVideoHref(videoUrl) {
  return `/api/videos/download?url=${encodeURIComponent(videoUrl)}`;
}
