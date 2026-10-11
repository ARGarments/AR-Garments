const pendingRequests = new Map<string, Promise<unknown>>();

export async function fetchJson<T>(url: string): Promise<T> {
  const pending = pendingRequests.get(url);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fetch(url, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Request failed for ${url} (${response.status}): ${body}`);
      }
      return response.json() as Promise<T>;
    })
    .finally(() => {
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, request);
  return request;
}
