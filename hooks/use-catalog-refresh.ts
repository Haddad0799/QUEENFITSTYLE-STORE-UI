'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Faz polling leve no endpoint de revalidação. Quando detecta que o cache do
 * catálogo foi invalidado (timestamp mudou), chama router.refresh() para
 * rebuscar os Server Components sem recarregar a página — o estado dos Client
 * Components (scroll, formulários, modais, carrinho) é preservado.
 *
 * Só consulta quando a aba está visível, para não gastar requisições em abas
 * em background; ao voltar o foco, faz uma checagem imediata.
 */
export function useCatalogRefresh(intervalMs = 30_000) {
  const router = useRouter()
  const lastSeenRef = useRef<number>(0)
  // Sentinela própria de "ainda não estabeleci o baseline". Não dá para usar
  // lastSeenRef === 0, porque o servidor também começa em 0 antes da primeira
  // revalidação — isso faria a primeira revalidação real ser tratada como
  // baseline e o refresh ser perdido.
  const initializedRef = useRef(false)

  useEffect(() => {
    let stopped = false

    const check = async () => {
      if (document.visibilityState !== 'visible') return

      try {
        const res = await fetch('/api/revalidate', { cache: 'no-store' })
        if (!res.ok) return

        const { lastRevalidatedAt } = (await res.json()) as {
          lastRevalidatedAt: number
        }

        // primeira checagem: só registra o baseline, sem refresh
        if (!initializedRef.current) {
          initializedRef.current = true
          lastSeenRef.current = lastRevalidatedAt
          return
        }

        if (lastRevalidatedAt > lastSeenRef.current) {
          lastSeenRef.current = lastRevalidatedAt
          router.refresh()
        }
      } catch {
        // falha silenciosa — tenta novamente no próximo intervalo
      }
    }

    void check() // checagem imediata ao montar

    const interval = setInterval(() => {
      if (!stopped) void check()
    }, intervalMs)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopped = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router, intervalMs])
}
