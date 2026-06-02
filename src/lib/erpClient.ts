import 'server-only'

import type { ReserveStockResponse } from '@/src/types/cart.types'

/**
 * Cliente server-only para o ERP (Java) via service token (machine-to-machine).
 *
 * - As credenciais (SERVICE_CLIENT_ID / SERVICE_CLIENT_SECRET) e o JWT de serviço
 *   vivem APENAS no servidor Next.js. O browser nunca os vê.
 * - O token é mantido em cache no escopo de módulo (memória do processo do servidor).
 * - Todo acesso a /erp/** passa por aqui — nunca direto do browser.
 */

const BACKEND_URL = process.env.BACKEND_URL
const SERVICE_CLIENT_ID = process.env.SERVICE_CLIENT_ID
const SERVICE_CLIENT_SECRET = process.env.SERVICE_CLIENT_SECRET

type ServiceTokenCache = {
  accessToken: string
  /** Date.now() + (expiresIn * 1000) - 30_000ms de margem de segurança. */
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

export class ErpClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'ErpClientError'
  }
}

/** Margem subtraída do tempo de expiração para evitar usar um token prestes a expirar. */
const TOKEN_EXPIRY_MARGIN_MS = 30_000

/** Cache do service token no escopo de módulo (não localStorage, não cookie, não Redis). */
let tokenCache: ServiceTokenCache | null = null

/**
 * Obtém um service token válido (ROLE_SERVICE), reaproveitando o cache em memória
 * enquanto não expirar. Privada ao módulo — nunca exportada.
 */
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

/** Cabeçalhos autenticados com o service token para chamadas ao /erp/**. */
async function authorizedHeaders(): Promise<HeadersInit> {
  const token = await getServiceToken()

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Reserva estoque de um SKU (usuário logado ou anônimo sempre usa o service token).
 */
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

/** Confirma a reserva (pagamento aprovado). */
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

/** Libera a reserva (carrinho expirou ou pagamento falhou). */
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

/** Consulta a disponibilidade de um SKU. */
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
