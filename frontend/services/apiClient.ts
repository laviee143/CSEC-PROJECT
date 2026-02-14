const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 15000;

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: ApiMethod;
  body?: string | FormData;
  token?: string | null;
  headers?: HeadersInit;
}

const parseApiError = async (response: Response): Promise<ApiError> => {
  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message =
    payload?.message ||
    payload?.error ||
    (response.status >= 500
      ? 'Server error. Please try again.'
      : 'Request failed. Please check your input and try again.');

  return new ApiError(message, response.status, payload?.errors || payload);
};

export const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // debug: show outgoing request
    console.debug('[apiRequest] ', `${API_BASE_URL}${endpoint}`, options.method || 'GET');
    const headers = new Headers(options.headers || {});
    const isFormData = options.body instanceof FormData;

    if (!isFormData) {
      headers.set('Content-Type', 'application/json');
    }

    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      body: options.body,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const parsed = await parseApiError(response);
      console.error('[apiRequest] response error', response.status, parsed.message, parsed.details);
      throw parsed;
    }

    const json = await response.json().catch(() => null);
    console.debug('[apiRequest] response ok', response.status, json);
    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection and try again.');
    }

    throw new ApiError('Unable to reach the server. Please verify backend connectivity.');
  } finally {
    clearTimeout(timeout);
  }
};
