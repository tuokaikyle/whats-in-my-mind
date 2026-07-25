const WORKER_URL = 'https://whats-in-my-mind-api.saline.workers.dev';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const workerUrl = `${WORKER_URL}${url.pathname}${url.search}`;

  return fetch(workerUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'manual',
  });
}
