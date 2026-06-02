import type { CartItem } from '@/src/types/cart.types'

const CART_STORAGE_KEY = 'queenfitstyle:cart:v1'
const CART_CHANNEL_NAME = 'queenfitstyle:cart'
const CART_LOCK_PREFIX = 'queenfitstyle:cart-lock:'
const DEFAULT_LOCK_TTL_MS = 10000
const LOCK_RETRY_INTERVAL_MS = 80

type CartStoragePayload = {
  items: CartItem[]
  updatedAt: string
}

type CartLockRecord = {
  ownerId: string
  expiresAt: number
}

type CartStorageEvent = {
  type: 'cart-updated'
  ownerId?: string
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as Partial<CartItem>

  return (
    typeof item.skuCode === 'string' &&
    typeof item.name === 'string' &&
    typeof item.image === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    typeof item.reservationId === 'string' &&
    typeof item.reservedAt === 'string' &&
    typeof item.expiresAt === 'string'
  )
}

function parseCartPayload(value: string | null): CartItem[] {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as Partial<CartStoragePayload> | CartItem[]
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
        ? parsed.items
        : []

    return items.filter(isCartItem)
  } catch {
    return []
  }
}

function getBroadcastChannel() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null
  }

  return new BroadcastChannel(CART_CHANNEL_NAME)
}

function notifyCartUpdated(ownerId?: string) {
  const channel = getBroadcastChannel()

  if (!channel) {
    return
  }

  channel.postMessage({
    type: 'cart-updated',
    ownerId,
  } satisfies CartStorageEvent)
  channel.close()
}

export function readCartItems() {
  if (!canUseBrowserStorage()) {
    return []
  }

  return parseCartPayload(window.localStorage.getItem(CART_STORAGE_KEY))
}

export function saveCartItems(items: CartItem[], ownerId?: string) {
  if (!canUseBrowserStorage()) {
    return
  }

  const payload: CartStoragePayload = {
    items,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload))
  notifyCartUpdated(ownerId)
}

export function clearCartItems(ownerId?: string) {
  saveCartItems([], ownerId)
}

export function subscribeToCartChanges(
  callback: () => void,
  ownerId?: string
) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const channel = getBroadcastChannel()

  function handleStorage(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY) {
      callback()
    }
  }

  function handleBroadcast(event: MessageEvent<CartStorageEvent>) {
    if (event.data?.type === 'cart-updated' && event.data.ownerId !== ownerId) {
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

export function createCartLockOwnerId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getLockStorageKey(lockKey: string) {
  return `${CART_LOCK_PREFIX}${lockKey}`
}

function readLock(lockKey: string): CartLockRecord | null {
  if (!canUseBrowserStorage()) {
    return null
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(getLockStorageKey(lockKey)) || 'null'
    ) as CartLockRecord | null

    if (
      parsed &&
      typeof parsed.ownerId === 'string' &&
      typeof parsed.expiresAt === 'number'
    ) {
      return parsed
    }
  } catch {
    return null
  }

  return null
}

function acquireCartOperationLock(
  lockKey: string,
  ownerId: string,
  ttlMs = DEFAULT_LOCK_TTL_MS
) {
  if (!canUseBrowserStorage()) {
    return true
  }

  const storageKey = getLockStorageKey(lockKey)
  const now = Date.now()
  const currentLock = readLock(lockKey)

  if (
    currentLock &&
    currentLock.ownerId !== ownerId &&
    currentLock.expiresAt > now
  ) {
    return false
  }

  const nextLock: CartLockRecord = {
    ownerId,
    expiresAt: now + ttlMs,
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextLock))

  return readLock(lockKey)?.ownerId === ownerId
}

function releaseCartOperationLock(lockKey: string, ownerId: string) {
  if (!canUseBrowserStorage()) {
    return
  }

  const currentLock = readLock(lockKey)

  if (currentLock?.ownerId === ownerId) {
    window.localStorage.removeItem(getLockStorageKey(lockKey))
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function withCartOperationLock<T>(
  lockKey: string,
  ownerId: string,
  operation: () => Promise<T>,
  options: {
    waitMs?: number
    ttlMs?: number
  } = {}
) {
  const waitMs = options.waitMs ?? 5000
  const expiresAt = Date.now() + waitMs

  while (!acquireCartOperationLock(lockKey, ownerId, options.ttlMs)) {
    if (Date.now() >= expiresAt) {
      throw new Error('Outra aba está sincronizando este item. Tente novamente em instantes.')
    }

    await wait(LOCK_RETRY_INTERVAL_MS)
  }

  try {
    return await operation()
  } finally {
    releaseCartOperationLock(lockKey, ownerId)
  }
}
