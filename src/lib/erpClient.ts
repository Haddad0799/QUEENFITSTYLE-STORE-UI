import 'server-only'

import { unstable_cache } from 'next/cache'
import type { ReserveStockResponse } from '@/src/types/cart.types'
import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderStatus,
} from '@/src/types/order.types'

const BACKEND_URL = process.env.BACKEND_URL
const SERVICE_CLIENT_ID = process.env.SERVICE_CLIENT_ID
const SERVICE_CLIENT_SECRET = process.env.SERVICE_CLIENT_SECRET

type ServiceTokenCache = {
  accessToken: string
  expiresAt: number
}

type ServiceTokenResponse = {
  accessToken: string
  expiresIn: number
}

export type { ReserveStockResponse }

export type StockResponse = {
  skuId: number
  availableQuantity: number
  reservedQuantity: number
}

/** Configurações da loja editáveis pela dona (GET /store/settings). */
export type StoreSettings = {
  /** Número do WhatsApp da loja, apenas dígitos (DDI 55). '' se não configurado. */
  whatsappPhone: string
}

/** Tag de cache para revalidar as configurações via POST /api/revalidate. */
export const STORE_SETTINGS_TAG = 'store-settings'

// Configurações mudam raramente: cacheamos por 1h, com revalidação por tag
// quando a dona altera algo no ERP.
const STORE_SETTINGS_REVALIDATE_SECONDS = 3600

export class ErpClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'ErpClientError'
  }
}

const TOKEN_EXPIRY_MARGIN_MS = 30_000

let tokenCache: ServiceTokenCache | null = null

async function getServiceToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken
  }

  const response = await fetch(`${BACKEND_URL}/auth/service/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: SERVICE_CLIENT_ID,
      clientSecret: SERVICE_CLIENT_SECRET,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new ErpClientError(
      'Falha ao obter o service token do ERP.',
      response.status
    )
  }

  const data = (await response.json()) as ServiceTokenResponse

  tokenCache = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000 - TOKEN_EXPIRY_MARGIN_MS,
  }

  return tokenCache.accessToken
}

async function authorizedHeaders(): Promise<HeadersInit> {
  const token = await getServiceToken()

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function reserveStock(
  skuCode: string,
  quantity: number
): Promise<ReserveStockResponse> {
  const response = await fetch(
    `${BACKEND_URL}/erp/skus/${skuCode}/stock/reserve`,
    {
      method: 'POST',
      headers: await authorizedHeaders(),
      body: JSON.stringify({ quantity }),
      cache: 'no-store',
    }
  )

  if (response.status !== 201) {
    throw new ErpClientError(
      `Falha ao reservar estoque do SKU ${skuCode}.`,
      response.status
    )
  }

  return (await response.json()) as ReserveStockResponse
}

export async function confirmReservation(reservationId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/erp/skus/reservations/${reservationId}/confirm`,
    {
      method: 'POST',
      headers: await authorizedHeaders(),
      cache: 'no-store',
    }
  )

  if (response.status !== 204) {
    throw new ErpClientError(
      `Falha ao confirmar a reserva ${reservationId}.`,
      response.status
    )
  }
}

export async function releaseReservation(reservationId: string): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/erp/skus/reservations/${reservationId}/release`,
    {
      method: 'POST',
      headers: await authorizedHeaders(),
      cache: 'no-store',
    }
  )

  if (response.status !== 204) {
    throw new ErpClientError(
      `Falha ao liberar a reserva ${reservationId}.`,
      response.status
    )
  }
}

export async function getStock(skuId: number): Promise<StockResponse> {
  const response = await fetch(`${BACKEND_URL}/erp/skus/${skuId}/stock`, {
    method: 'GET',
    headers: await authorizedHeaders(),
    cache: 'no-store',
  })

  if (response.status !== 200) {
    throw new ErpClientError(
      `Falha ao consultar o estoque do SKU ${skuId}.`,
      response.status
    )
  }

  return (await response.json()) as StockResponse
}

export async function createStoreOrder(
  input: CreateOrderInput
): Promise<CreateOrderResponse> {
  const response = await fetch(`${BACKEND_URL}/store/orders`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ErpClientError(
      'Falha ao criar pedido na loja.',
      response.status,
      body
    )
  }

  return body as CreateOrderResponse
}

/**
 * Consulta o status atual de um pedido no ERP (autenticado com o service token).
 *
 * Usa o endpoint existente GET /erp/orders/{orderId}, que retorna o
 * OrderDetailsDTO completo — só aproveitamos o campo `status`.
 */
export async function getOrderStatusErp(orderId: number): Promise<OrderStatus> {
  const response = await fetch(`${BACKEND_URL}/erp/orders/${orderId}`, {
    method: 'GET',
    headers: await authorizedHeaders(),
    cache: 'no-store',
  })

  if (response.status !== 200) {
    throw new ErpClientError(
      `Falha ao consultar status do pedido ${orderId}.`,
      response.status
    )
  }

  const data = (await response.json()) as { status: OrderStatus }
  return data.status
}

/** Cancela um pedido pelo e-commerce (autenticado com o service token). */
export async function cancelOrderErp(orderId: number): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/erp/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: await authorizedHeaders(),
      body: JSON.stringify({}),
      cache: 'no-store',
    }
  )

  if (response.status !== 200 && response.status !== 204) {
    throw new ErpClientError('Falha ao cancelar pedido', response.status)
  }
}

function normalizeStoreSettings(data: unknown): StoreSettings {
  const record = (data && typeof data === 'object' ? data : {}) as Record<
    string,
    unknown
  >
  // O ERP retorna snake_case (whatsapp_phone); aceitamos camelCase por garantia.
  const rawPhone =
    typeof record.whatsapp_phone === 'string'
      ? record.whatsapp_phone
      : typeof record.whatsappPhone === 'string'
        ? record.whatsappPhone
        : ''

  // Apenas dígitos: remove +, espaços, parênteses e hífens que possam vir.
  return { whatsappPhone: rawPhone.replace(/\D/g, '') }
}

async function fetchStoreSettings(): Promise<StoreSettings> {
  const response = await fetch(`${BACKEND_URL}/store/settings`, {
    method: 'GET',
    headers: await authorizedHeaders(),
    cache: 'no-store',
  })

  if (response.status !== 200) {
    throw new ErpClientError(
      'Falha ao consultar as configurações da loja.',
      response.status
    )
  }

  return normalizeStoreSettings(await response.json())
}

/**
 * Configurações da loja (GET /store/settings), autenticado com o service token —
 * a mesma autenticação dos demais endpoints /store/*.
 *
 * O resultado é cacheado por tag/revalidate via unstable_cache. Assim o fetch
 * autenticado (e o token no-store) não roda a cada render nem força renderização
 * dinâmica das páginas que consomem isto (ex.: o footer no layout). Para forçar
 * atualização imediata: revalidateTag('store-settings').
 */
export const getStoreSettings = unstable_cache(
  fetchStoreSettings,
  [STORE_SETTINGS_TAG],
  { tags: [STORE_SETTINGS_TAG], revalidate: STORE_SETTINGS_REVALIDATE_SECONDS }
)
