import type { CartItem } from '@/src/types/cart.types'

export const RESERVATION_TTL_MS = 2 * 60 * 60 * 1000
export const PENDING_RESERVATION_PREFIX = 'pending-reservation:'
// Rascunho: item que permanece no carrinho sem reserva ativa (ex.: o pedido foi
// cancelado pelo ERP e as reservas já foram liberadas). Diferente do "pending",
// o rascunho NÃO é transitório nem removido automaticamente — ele só ganha uma
// reserva nova quando o cliente mexe na quantidade, remove ou finaliza de novo.
export const DRAFT_RESERVATION_PREFIX = 'draft-reservation:'

export function createReservationWindow(now = new Date()) {
  const reservedAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS).toISOString()

  return {
    reservedAt,
    expiresAt,
  }
}

export function getReservationTimeLeftMs(
  item: Pick<CartItem, 'expiresAt'>,
  now = Date.now()
) {
  const expiresAt = new Date(item.expiresAt).getTime()

  if (!Number.isFinite(expiresAt)) {
    return 0
  }

  return Math.max(0, expiresAt - now)
}

export function isReservationExpired(
  item: Pick<CartItem, 'expiresAt'>,
  now = Date.now()
) {
  return getReservationTimeLeftMs(item, now) <= 0
}

export function formatReservationTimeLeft(timeLeftMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

export function createPendingReservationId(skuCode: string) {
  return `${PENDING_RESERVATION_PREFIX}${skuCode}:${Date.now()}`
}

export function isPendingReservationId(reservationId: string) {
  return reservationId.startsWith(PENDING_RESERVATION_PREFIX)
}

export function createDraftReservationId(skuCode: string) {
  return `${DRAFT_RESERVATION_PREFIX}${skuCode}:${Date.now()}`
}

export function isDraftReservationId(reservationId: string) {
  return reservationId.startsWith(DRAFT_RESERVATION_PREFIX)
}

export function splitCartItemsByExpiration(items: CartItem[], now = Date.now()) {
  return items.reduce(
    (result, item) => {
      // Rascunhos ficam sempre "válidos": não têm reserva no ERP para liberar e
      // não devem ser removidos automaticamente — serão re-reservados sob demanda.
      if (isDraftReservationId(item.reservationId)) {
        result.valid.push(item)
      } else if (isReservationExpired(item, now) || isPendingReservationId(item.reservationId)) {
        result.expired.push(item)
      } else {
        result.valid.push(item)
      }

      return result
    },
    {
      valid: [] as CartItem[],
      expired: [] as CartItem[],
    }
  )
}
