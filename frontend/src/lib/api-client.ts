import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import {
  getCsrfToken,
  setCsrfToken,
} from "@/lib/csrf";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let refreshPromise: Promise<void> | null = null;

let csrfPromise: Promise<string> | null = null;

const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"];

export async function initializeCsrfToken(): Promise<string> {
  const existingToken = getCsrfToken();

  if (existingToken) {
    return existingToken;
  }

  if (!csrfPromise) {
    csrfPromise = apiClient
      .get<ApiResponse<{ csrfToken: string }>>("/auth/csrf-token")
      .then((response) => {
        const token = response.data.data.csrfToken;

        setCsrfToken(token);

        return token;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

// Attach CSRF token to mutation requests.
apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();

  if (method && mutationMethods.includes(method)) {
    const token = await initializeCsrfToken();

    config.headers.set("x-csrf-token", token);
  }

  return config;
});

// Refresh the access token once when an authenticated request returns 401.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableRequestConfig
      | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    const excludedEndpoints = [
      "/auth/login",
      "/auth/refresh",
      "/auth/logout",
      "/auth/csrf-token",
    ];

    const isExcludedEndpoint = excludedEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (originalRequest._retry || isExcludedEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          await initializeCsrfToken();

          await apiClient.post("/auth/refresh");
        })().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);