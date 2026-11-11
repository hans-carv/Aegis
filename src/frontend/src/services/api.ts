// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export function getAuthToken(): string | null {
  return localStorage.getItem('teo_auth_token')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('teo_auth_token', token)
}

export function removeAuthToken(): void {
  localStorage.removeItem('teo_auth_token')
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`
    throw new Error(errorMsg)
  }

  return data as T
}
