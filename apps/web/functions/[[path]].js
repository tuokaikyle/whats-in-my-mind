const API_ORIGIN = 'https://whats-in-my-mind-api.saline.workers.dev';

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);

  if (
    !incomingUrl.pathname.startsWith('/api/auth/') &&
    !incomingUrl.pathname.startsWith('/trpc/')
  ) {
    return context.next();
  }

  const upstreamUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    API_ORIGIN
  );

  const upstreamRequest = new Request(upstreamUrl, context.request);

  return fetch(upstreamRequest);
}
