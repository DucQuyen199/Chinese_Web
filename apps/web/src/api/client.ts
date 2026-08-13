import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, User } from '../types';

declare module 'axios' {
  interface AxiosRequestConfig { _retry?: boolean; skipRefresh?: boolean }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  timeout: 12_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let refreshRequest: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; skipRefresh?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retry || original.skipRefresh || original.url?.includes('/auth/refresh')) throw error;
    original._retry = true;
    refreshRequest ??= apiClient.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/refresh', undefined, { skipRefresh: true }).then(({ data }) => { setAccessToken(data.data.accessToken); return data.data.accessToken; }).catch(() => { setAccessToken(null); return null; }).finally(() => { refreshRequest = null; });
    const token = await refreshRequest;
    if (!token) throw error;
    original.headers.Authorization = `Bearer ${token}`;
    return apiClient(original);
  },
);

export async function apiGet<T>(url: string, params?: Record<string, string | number | undefined>) {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown) {
  const response = await apiClient.patch<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function apiDelete<T>(url: string, body?: unknown) {
  const response = await apiClient.delete<ApiResponse<T>>(url, { data: body });
  return response.data.data;
}

export async function apiUpload<T>(url: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<T>>(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data.data;
}

export default apiClient;
