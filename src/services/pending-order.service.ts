import type { PendingOrder, PendingOrderItem } from '@/src/types/order.types'

const PENDING_ORDER_STORAGE_KEY = 'queenfitstyle:pending-order:v1'
const PENDING_ORDER_CHANNEL_NAME = 'queenfitstyle:pending-order'

type PendingOrderStorageEvent = {
  type: 'pending-order-updated'
  ownerId?: string
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isPendingOrderItem(value: unknown): value is PendingOrderItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PendingOrderItem>
  return (
    typeof item.skuCode === 'string' &&
    typeof item.name === 'string' &&
    typeof item.image === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number'
  )
}

function isPendingOrder(value: unknown): value is PendingOrder {
  if (!value || typeof value !== 'object') return false
  const order = value as Partial<PendingOrder>
  const customer = order.customer as Partial<PendingOrder['customer']> | undefined

  return (
    typeof order.orderId === 'number' &&
    typeof order.status === 'string' &&
    typeof order.whatsappUrl === 'string' &&
    !!customer &&
    typeof customer.name === 'string' &&
    typeof customer.phone === 'string' &&
    typeof customer.city === 'string' &&
    Array.isArray(order.items) &&
    order.items.every(isPendingOrderItem) &&
    typeof order.subtotal === 'number' &&
    typeof order.createdAt === 'string'
  )
}

function getBroadcastChannel() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null
  }
  return new BroadcastChannel(PENDING_ORDER_CHANNEL_NAME)
}

function notifyPendingOrderUpdated(ownerId?: string) {
  const channel = getBroadcastChannel()
  if (!channel) return
  channel.postMessage({
    type: 'pending-order-updated',
    ownerId,
  } satisfies PendingOrderStorageEvent)
  channel.close()
}

export function readPendingOrder(): PendingOrder | null {
  if (!canUseBrowserStorage()) return null

  try {
    const raw = window.localStorage.getItem(PENDING_ORDER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isPendingOrder(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function savePendingOrder(order: PendingOrder, ownerId?: string) {
  if (!canUseBrowserStorage()) return
  window.localStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(order))
  notifyPendingOrderUpdated(ownerId)
}

export function clearPendingOrder(ownerId?: string) {
  if (!canUseBrowserStorage()) return
  window.localStorage.removeItem(PENDING_ORDER_STORAGE_KEY)
  notifyPendingOrderUpdated(ownerId)
}

export function subscribeToPendingOrderChanges(
  callback: () => void,
  ownerId?: string
) {
  if (typeof window === 'undefined') return () => undefined

  const channel = getBroadcastChannel()

  function handleStorage(event: StorageEvent) {
    if (event.key === PENDING_ORDER_STORAGE_KEY) callback()
  }

  function handleBroadcast(event: MessageEvent<PendingOrderStorageEvent>) {
    if (
      event.data?.type === 'pending-order-updated' &&
      event.data.ownerId !== ownerId
    ) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorage)
  channel?.addEventListener('message', handleBroadcast)

  return () => {
    window.removeEventListener('storage', handleStorage)
    channel?.removeEventListener('message', handleBroadcast)
    channel?.close()
  }
}
