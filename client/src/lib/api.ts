import axios from 'axios';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message?: string }>;
  };
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: Array<{ field?: string; message?: string }>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiFailure>(error)) {
      const payload = error.response?.data;
      const message =
        payload?.error?.message ||
        (error.code === 'ECONNABORTED'
          ? 'The request took too long. Please try again.'
          : error.message || 'Unable to reach the server.');
      return Promise.reject(
        new ApiRequestError(
          message,
          error.response?.status,
          payload?.error?.code,
          payload?.error?.details
        )
      );
    }

    return Promise.reject(error);
  }
);
