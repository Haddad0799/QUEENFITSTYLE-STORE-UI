'use client'

import { useEffect, useRef } from 'react'
import type { OrderStatus } from '@/src/types/order.types'

export type { OrderStatus }

// Statuses que indicam que o pedido foi resolvido (parar de acompanhar).
// Qualquer coisa diferente de PENDING_PAYMENT é terminal: PAID é a confirmação
// de pagamento do ERP (não existe "CONFIRMED"); DELIVERED/RETURNED só ocorrem
// depois de pago; CANCELLED/EXPIRED encerram por falta de pagamento.
const TERMINAL_STATUSES: ReadonlyArray<OrderStatus> = [
  'PAID',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
  'EXPIRED',
]

// Backoff padrão: checagens nos instantes 0s, +15s, +45s, +1m45s, +3m45s,
// +5m45s (≈6 checagens em ~6 min). Esse é o intervalo em que cliente e
// vendedora costumam estar conversando no WhatsApp, então é quando uma
// confirmação rápida pode acontecer. Depois disso paramos o loop: o estado é
// re-verificado apenas quando a cliente volta para a aba (foco/visibilidade).
const DEFAULT_BACKOFF_SCHEDULE_MS: ReadonlyArray<number> = [
  15_000, 30_000, 60_000, 120_000, 120_000,
]

// Evita rajadas: ignora uma checagem disparada por foco se já checamos há menos
// que isso.
const FOCUS_CHECK_THROTTLE_MS = 10_000

export interface UseOrderStatusPollingOptions {
  orderId: string | number | null
  enabled: boolean
  onStatusChange: (status: OrderStatus) => void
  /**
   * Intervalos (ms) entre as checagens ativas após a primeira (imediata).
   * Quando a lista se esgota, o polling ativo para e passamos a re-checar
   * apenas quando a aba recebe foco. Padrão: backoff de ~6 min.
   */
  backoffScheduleMs?: ReadonlyArray<number>
}

/**
 * Acompanha o status de um pedido criado pelo fluxo "boca a boca" do WhatsApp.
 *
 * A confirmação depende de um humano (a vendedora clica em confirmar no ERP
 * depois de receber o pagamento), então pode levar de minutos a dias — polling
 * contínuo seria desperdício. A estratégia:
 *
 *   1. Backoff curto logo após criar o pedido, captando confirmações rápidas
 *      enquanto a conversa no WhatsApp ainda está quente.
 *   2. Depois, sem loop: re-checa só quando a cliente volta para a aba.
 *
 * O aviso "de verdade" de confirmação chega pelo próprio WhatsApp; aqui só
 * mantemos a tela coerente quando a cliente olha.
 *
 * SUBSTITUIÇÃO POR SSE NO FUTURO: crie um `useOrderStatusSSE` com a MESMA
 * assinatura (orderId, enabled, onStatusChange) e troque só a importação.
 */
export function useOrderStatusPolling({
  orderId,
  enabled,
  onStatusChange,
  backoffScheduleMs = DEFAULT_BACKOFF_SCHEDULE_MS,
}: UseOrderStatusPollingOptions) {
  // Mantém o callback atual sem reiniciar o ciclo a cada render.
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  useEffect(() => {
    if (!enabled || orderId == null) return

    let stopped = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let lastCheckAt = 0

    async function check(): Promise<boolean> {
      // Evita requisições sobrepostas (ex.: timer e foco quase juntos).
      if (inFlight) return false
      inFlight = true
      lastCheckAt = Date.now()

      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: 'no-store',
        })

        if (!res.ok) return false

        const data = (await res.json()) as { status: OrderStatus }
        onStatusChangeRef.current(data.status)

        return TERMINAL_STATUSES.includes(data.status)
      } catch {
        // falha silenciosa — o próximo tick/foco tenta de novo
        return false
      } finally {
        inFlight = false
      }
    }

    async function tick(step: number) {
      if (stopped) return

      const shouldStop = await check()
      if (stopped) return
      if (shouldStop) {
        cleanupListeners()
        return
      }

      const delay = backoffScheduleMs[step]
      // Esgotou o backoff: para o loop ativo. A partir daqui só o foco re-checa.
      if (delay == null) return

      timeoutId = setTimeout(() => void tick(step + 1), delay)
    }

    async function checkOnFocus() {
      if (stopped || document.visibilityState !== 'visible') return
      // Throttle: não re-checa se acabamos de checar.
      if (Date.now() - lastCheckAt < FOCUS_CHECK_THROTTLE_MS) return

      const shouldStop = await check()
      if (shouldStop) cleanupListeners()
    }

    function cleanupListeners() {
      window.removeEventListener('focus', checkOnFocus)
      document.removeEventListener('visibilitychange', checkOnFocus)
    }

    // Re-checa quando a cliente volta para a aba, mesmo após o backoff parar.
    window.addEventListener('focus', checkOnFocus)
    document.addEventListener('visibilitychange', checkOnFocus)

    void tick(0) // primeira checagem imediata

    return () => {
      stopped = true
      if (timeoutId) clearTimeout(timeoutId)
      cleanupListeners()
    }
  }, [enabled, orderId, backoffScheduleMs])
}
