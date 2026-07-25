// Typed fetch wrapper around the Django REST backend. Requests stay
// same-origin (`/api/**`) and are proxied to Django via the `routeRules`
// in nuxt.config.ts, so this composable never needs to know the real
// backend host — dev, docker and prod all just work.

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(typeof data.detail === 'string' ? data.detail : `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Field-level validation errors (`{ email: ['already taken'] }`) take priority
// over the generic `non_field_errors`/`error`/`detail` keys DRF falls back to.
export function getApiErrorMessage(error: unknown, fallback: string, fields: string[] = []): string {
  if (!(error instanceof ApiError)) return fallback;
  const data = error.data;

  for (const field of fields) {
    const value = data[field];
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()) return value[0];
  }

  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) return data.non_field_errors[0];
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;

  return fallback;
}

const REQUEST_TIMEOUT_MS = 30_000;
const AUTH_ENDPOINT_RE = /\/auth\/(login|register|token\/refresh|logout|oauth\/(config|google|facebook|telegram))\/?$/;

export function useApi() {
  const config = useRuntimeConfig();

  async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    opts: { body?: unknown; params?: Record<string, unknown> } = {},
    retryAuth = true,
  ): Promise<T> {
    try {
      return await $fetch<T>(path, {
        baseURL: config.public.apiBase,
        method,
        body: opts.body as never,
        query: opts.params,
        credentials: 'include',
        timeout: REQUEST_TIMEOUT_MS,
      });
    }
    catch (error: unknown) {
      const fetchError = error as { response?: { status: number; _data?: Record<string, unknown> } };
      const status = fetchError.response?.status ?? 0;
      const data = fetchError.response?._data ?? {};

      if (status === 401 && retryAuth && !AUTH_ENDPOINT_RE.test(path)) {
        try {
          await request('POST', '/auth/token/refresh/', {}, false);
          return request<T>(method, path, opts, false);
        }
        catch {
          syncAuthState(false);
          await request('POST', '/auth/logout/', {}, false).catch(() => {});
        }
      }

      throw new ApiError(status, data);
    }
  }

  return {
    get: <T>(path: string, params?: Record<string, unknown>) => request<T>('GET', path, { params }),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}
