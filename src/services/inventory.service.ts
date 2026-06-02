import type { ReserveStockResponse } from '@/src/types/cart.types'

/**
 * Serviço de inventário do lado do browser.
 *
 * NÃO chama o ERP diretamente: todas as operações passam pelas API Routes do
 * Next.js (/api/cart/**), que injetam o service token no servidor. As credenciais
 * e o JWT de serviço nunca chegam ao browser.
 */

const RESERVE_ENDPOINT = '/api/cart/reserve'
const CONFIRM_ENDPOINT = '/api/cart/confirm'
const RELEASE_ENDPOINT = '/api/cart/release'

const DEFAULT_ERROR_MESSAGE =
  'Não foi possível sincronizar o carrinho com o estoque.'

/** Erro de uma chamada às API Routes de carrinho, carregando o status HTTP. */
export class InventoryRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'InventoryRequestError'
  }
}

function normalizeReservationResponse(data: unknown): ReserveStockResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta de reserva inválida.')
  }

  const reservationId = 'reservationId' in data ? data.reservationId : undefined
  const skuCode = 'skuCode' in data ? data.skuCode : undefined
  const quantity = 'quantity' in data ? data.quantity : undefined

  if (
    typeof reservationId !== 'string' ||
    typeof skuCode !== 'string' ||
    typeof quantity !== 'number'
  ) {
    throw new Error('Resposta de reserva incompleta.')
  }

  return {
    reservationId,
    skuCode,
    quantity,
  }
}

/** Extrai a mensagem de erro do corpo JSON ({ error }) retornado pelas API Routes. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error.trim()
    ) {
      return body.error
    }
  } catch {
    // corpo vazio ou não-JSON (ex.: 204) — usa a mensagem padrão
  }

  return DEFAULT_ERROR_MESSAGE
}

export async function reserveStock(
  skuCode: string,
  quantity: number
): Promise<ReserveStockResponse> {
  const response = await fetch(RESERVE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skuCode, quantity }),
  })

  if (!response.ok) {
    throw new InventoryRequestError(
      await readErrorMessage(response),
      response.status
    )
  }

  return normalizeReservationResponse(await response.json())
}

export async function confirmReservation(reservationId: string): Promise<void> {
  const response = await fetch(CONFIRM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservationId }),
  })

  if (!response.ok) {
    throw new InventoryRequestError(
      await readErrorMessage(response),
      response.status
    )
  }
}

export async function releaseReservation(reservationId: string): Promise<void> {
  const response = await fetch(RELEASE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservationId }),
  })

  if (!response.ok) {
    throw new InventoryRequestError(
      await readErrorMessage(response),
      response.status
    )
  }
}

export function isReservationAlreadyGone(error: unknown) {
  return (
    error instanceof InventoryRequestError &&
    (error.status === 404 || error.status === 410)
  )
}

export function getInventoryErrorMessage(error: unknown) {
  if (error instanceof InventoryRequestError && error.message.trim()) {
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return DEFAULT_ERROR_MESSAGE
}
