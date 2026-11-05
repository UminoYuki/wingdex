/** 本地服务 HTTP 客户端：统一错误、query 拼装与媒体 URL 生成 */

const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type QueryValue = string | number | boolean | null | undefined

export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options
  const response = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `请求失败（${response.status}）`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    apiRequest<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) =>
    apiRequest<T>(path, { method: 'POST', body, query }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, query?: Record<string, QueryValue>) =>
    apiRequest<T>(path, { method: 'DELETE', query }),
}

/** 媒体 URL：缩略图仅支持 240 / 640 / 1600 三档 */
export type ThumbSize = 240 | 640 | 1600

export const mediaUrl = {
  thumb: (photoId: number, size: ThumbSize = 640) => `${API_BASE}/media/photo/${photoId}/thumb?size=${size}`,
  full: (photoId: number, max?: number) =>
    `${API_BASE}/media/photo/${photoId}/full${max ? `?max=${max}` : ''}`,
  wiki: (key: string) => `${API_BASE}/media/wiki/${encodeURIComponent(key)}`,
  speciesAsset: (id: number, kind: 'sound' | 'video') => `${API_BASE}/media/species/${id}/${kind}`,
  asset: (key: string) => `${API_BASE}/media/asset/${encodeURIComponent(key)}`,
  exportFile: (file: string) => `${API_BASE}/media/export/${encodeURIComponent(file)}`,
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '未知错误'
}
