const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000/media';
const STATIC_BASE_URL =
  process.env.NEXT_PUBLIC_STATIC_URL || 'http://localhost:8000/static';
const REQUEST_TIMEOUT_MS = 30_000;

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface RequestConfig {
  params?: object;
  headers?: Record<string, string>;
}

interface ApiErrorResponse {
  status: number;
  data: Record<string, unknown>;
}

export class ApiError extends Error {
  response: ApiErrorResponse;

  constructor(status: number, data: Record<string, unknown>) {
    super(
      typeof data.detail === 'string'
        ? data.detail
        : `API request failed with status ${status}`
    );
    this.name = 'ApiError';
    this.response = { status, data };
  }
}

function buildRequestUrl(path: string, params?: object) {
  const basePath = /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
  if (!params) return basePath;

  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, String(item)));
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) return basePath;
  return `${basePath}${basePath.includes('?') ? '&' : '?'}${query}`;
}

async function parseResponse(
  response: Response
): Promise<Record<string, unknown>> {
  if (response.status === 204) return {};
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as Record<string, unknown>;
  }
  const text = await response.text();
  return text ? { detail: text } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config: RequestConfig = {},
  retryAuth = true
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const isFormData = body instanceof FormData;
    const response = await fetch(buildRequestUrl(path, config.params), {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isFormData
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...config.headers,
      },
      body:
        body === undefined
          ? undefined
          : isFormData
            ? body
            : JSON.stringify(body),
    });

    const data = await parseResponse(response);
    if (response.ok) {
      return { data: data as T, status: response.status };
    }

    const isAuthEndpoint =
      /\/auth\/(login|register|token\/refresh|logout)\/?$/.test(path);
    if (response.status === 401 && retryAuth && !isAuthEndpoint) {
      try {
        await request('POST', '/auth/token/refresh/', {}, {}, false);
        return request<T>(method, path, body, config, false);
      } catch {
        try {
          await request('POST', '/auth/logout/', {}, {}, false);
        } catch {
          // The server session is already invalid.
        }
      }
    }

    throw new ApiError(response.status, data);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get<T>(path: string, config?: RequestConfig) {
    return request<T>('GET', path, undefined, config);
  },
  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return request<T>('POST', path, body, config);
  },
  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return request<T>('PUT', path, body, config);
  },
  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return request<T>('PATCH', path, body, config);
  },
  delete<T>(path: string, config?: RequestConfig) {
    return request<T>('DELETE', path, undefined, config);
  },
};

export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getStaticUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${STATIC_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const getImageUrl = (
  path: string,
  fallback = '/images/placeholder.png'
) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/products/') || path.startsWith('/images/')) {
    return path;
  }
  return getMediaUrl(path);
};

export default apiClient;
