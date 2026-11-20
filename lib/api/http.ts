/** Error thrown for a failed API call; `message` is the backend's own message, safe to show. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function readJson(res: Response) { try { return await res.json(); } catch { return null; } }

/** Calls the backend and returns its full JSON body (`{ data, count, … }`). Never throws on network trouble: it becomes an ApiError. */
export async function apiJson<T = { data: unknown }>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "include",
      signal: init?.signal,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }
  const json = await readJson(res);
  if (!res.ok) throw new ApiError((json as { error?: string } | null)?.error || `Request failed (${res.status})`, res.status, json);
  return json as T;
}
/** Same call, returning just `data`. */
export async function api<T>(path: string, init?: Parameters<typeof apiJson>[1]): Promise<T> {
  return (await apiJson<{ data: T }>(path, init)).data;
}
