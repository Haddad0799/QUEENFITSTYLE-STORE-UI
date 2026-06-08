'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api/api-client'
import { resolveApiError, type ResolvedError } from '@/lib/errors/resolve-error'

export function useErrorModal() {
  const [error, setError] = useState<ResolvedError | null>(null)

  const handleError = useCallback((err: unknown) => {
    // ApiError carrega o ProblemDetail; qualquer outra coisa cai no erro padrão.
    setError(resolveApiError(err instanceof ApiError ? err.problem : null))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
