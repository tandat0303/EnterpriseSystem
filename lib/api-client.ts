import { getToken } from "./auth-client"

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(url: string, method: string, data?: any, options?: RequestOptions): Promise<T> {
  const token = getToken()

  // Initialize headers as a mutable Record<string, string>
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Safely merge existing headers from options
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      // If it's a plain object (Record<string, string>), merge it
      Object.assign(headers, options.headers)
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let requestUrl = url
  if (options?.params) {
    const query = new URLSearchParams()
    for (const key in options.params) {
      const value = options.params[key]
      if (value !== undefined) {
        query.append(key, String(value))
      }
    }
    if (query.toString()) {
      requestUrl = `${url}?${query.toString()}`
    }
  }

  const { headers: optionsHeaders, ...restOptions } = options || {}

  const config: RequestInit = {
    method,
    headers: headers,
    ...restOptions,
  }

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data)
  }

  const response = await fetch(requestUrl, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(errorData.error || errorData.message || "An unknown error occurred")
  }

  // Handle cases where response might be empty (e.g., DELETE requests)
  try {
    return (await response.json()) as T
  } catch (e) {
    return {} as T
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, "GET", undefined, options),
  post: <T>(url: string, data: any, options?: RequestOptions) => request<T>(url, "POST", data, options),
  put: <T>(url: string, data: any, options?: RequestOptions) => request<T>(url, "PUT", data, options),
  delete: <T>(url: string, options?: RequestOptions) => request<T>(url, "DELETE", undefined, options),
}
