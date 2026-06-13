'use client'

import { useEffect, useState } from 'react'

/**
 * Retorna o valor mais recente apenas após `delayMs` sem alterações.
 * Útil para adiar efeitos custosos (ex.: navegação/fetch) enquanto a
 * usuária ainda está digitando.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
