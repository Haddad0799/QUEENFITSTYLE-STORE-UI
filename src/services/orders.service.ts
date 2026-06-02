import axios, { AxiosError } from 'axios'
import type {
  CreateOrderInput,
  CreateOrderResponse,
} from '@/src/types/order.types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const ordersApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function normalizeOrderResponse(data: unknown): CreateOrderResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Resposta de pedido inválida.')
  }

  const orderId = 'orderId' in data ? data.orderId : undefined
  const status = 'status' in data ? data.status : undefined
  const whatsappUrl = 'whatsappUrl' in data ? data.whatsappUrl : undefined

  if (
    typeof orderId !== 'number' ||
    typeof status !== 'string' ||
    typeof whatsappUrl !== 'string'
  ) {
    throw new Error('Resposta de pedido incompleta.')
  }

  return { orderId, status, whatsappUrl }
}

export async function createOrder(input: CreateOrderInput) {
  const response = await ordersApi.post<unknown>('/store/orders', input)
  return normalizeOrderResponse(response.data)
}

export async function cancelOrder(orderId: number) {
  await ordersApi.post(`/store/orders/${orderId}/cancel`)
}

export function isOrderAlreadyGone(error: unknown) {
  return (
    error instanceof AxiosError &&
    (error.response?.status === 404 || error.response?.status === 410)
  )
}

export function getOrderErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data

    if (payload && typeof payload === 'object') {
      if ('detail' in payload && typeof payload.detail === 'string') {
        return payload.detail
      }
      if ('message' in payload && typeof payload.message === 'string') {
        return payload.message
      }
      if ('error' in payload && typeof payload.error === 'string') {
        return payload.error
      }
    }

    if (typeof payload === 'string' && payload.trim()) {
      return payload
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Não foi possível finalizar o pedido. Tente novamente.'
}
