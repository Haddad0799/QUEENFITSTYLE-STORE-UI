/**
 * Cliente HTTP único do frontend. SEMPRE use `apiFetch` nas chamadas à API —
 * nunca `fetch` direto nos componentes. Em caso de resposta não-ok, lança um
 * `ApiError` carregando o corpo (idealmente um ProblemDetail) para que
 * `resolveApiError` resolva a mensagem amigável.
 */

export class ApiError extends Error {
  constructor(public readonly problem: unknown) {
    super('API Error')
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = {
        status: res.status,
        type: 'https://example.com/probs/internal-server-error',
      }
    }
    throw new ApiError(body)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
