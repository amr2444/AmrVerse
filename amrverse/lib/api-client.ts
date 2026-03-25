import type { ApiResponse } from "@/lib/types"

type ApiSuccessResponse<T> = ApiResponse<T> & { data: T }

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  if (!query) {
    return path
  }

  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue
    searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

async function request<T>(path: string, init?: RequestInit, query?: Record<string, string | number | boolean | undefined | null>): Promise<ApiSuccessResponse<T>> {
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData

  const response = await fetch(buildUrl(path, query), {
    credentials: "include",
    ...init,
    headers: {
      ...(!isFormDataBody && init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.error || payload?.message || "Request failed", response.status)
  }

  return payload as ApiSuccessResponse<T>
}

export function apiGet<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  return request<T>(path, { method: "GET" }, query)
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiPatch<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function apiDelete<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  return request<T>(path, { method: "DELETE" }, query)
}

export function apiPostForm<T>(path: string, formData: FormData) {
  return request<T>(path, {
    method: "POST",
    body: formData,
    headers: {},
  })
}

export { ApiError }
