'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Retorna o valor mais recente apenas após `delayMs` sem alterações.
 * Útil para adiar efeitos custosos (ex.: navegação/fetch) enquanto a
 * usuária ainda está digitando.
 *
 * `resetKey` é uma blindagem opcional: sempre que ele muda, qualquer debounce
 * pendente é cancelado e o valor é alinhado na hora. Use, por exemplo, o
 * pathname para garantir que um timer antigo não dispare depois que a navegação
 * para outra rota já começou.
 */
export function useDebouncedValue<T>(value: T, delayMs: number, resetKey?: unknown): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timerRef = useRef<number | null>(null)

  function clearPending() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    clearPending()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setDebouncedValue(value)
    }, delayMs)

    return clearPending
  }, [value, delayMs])

  // Cancela o debounce pendente e sincroniza o valor imediatamente quando o
  // resetKey muda — impede que um timer agendado antes da troca de rota dispare
  // depois dela.
  useEffect(() => {
    clearPending()
    setDebouncedValue(value)
    // Intencional: roda apenas quando resetKey muda, não a cada novo `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  return debouncedValue
}
