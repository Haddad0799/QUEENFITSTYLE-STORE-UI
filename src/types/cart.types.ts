import type {
  CreateOrderResponse,
  DeliveryAddress,
  OrderCustomerInput,
  PendingOrder,
} from '@/src/types/order.types'

export type CartItem = {
  skuCode: string
  name: string
  image: string
  price: number
  quantity: number
  reservationId: string
  reservedAt: string
  expiresAt: string
}

export type ReserveStockResponse = {
  reservationId: string
  skuCode: string
  quantity: number
}

export type AddCartItemInput = {
  skuCode: string
  name: string
  image: string
  price: number
  quantity?: number
}

export type CartOperationResult = {
  ok: boolean
  message?: string
}

export type CartStep = 'cart' | 'checkout' | 'pending-order'

export type SubmitOrderInput = {
  customer: OrderCustomerInput
  deliveryAddress: DeliveryAddress
  notes?: string
}

export type SubmitOrderResult =
  | { ok: true; order: CreateOrderResponse }
  | { ok: false; message: string }

export type CancelPendingOrderResult = {
  ok: boolean
  message?: string
}

export type CartContextValue = {
  items: CartItem[]
  isHydrated: boolean
  isCartOpen: boolean
  totalItems: number
  subtotal: number
  step: CartStep
  pendingOrder: PendingOrder | null
  isSubmittingOrder: boolean
  isCancellingOrder: boolean
  setCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  goToCheckout: () => void
  backToCart: () => void
  addItem: (item: AddCartItemInput) => Promise<CartOperationResult>
  increaseQuantity: (skuCode: string) => Promise<CartOperationResult>
  decreaseQuantity: (skuCode: string) => Promise<CartOperationResult>
  removeItem: (skuCode: string) => Promise<CartOperationResult>
  submitOrder: (input: SubmitOrderInput) => Promise<SubmitOrderResult>
  openWhatsAppAndComplete: (options?: { allowSameTabFallback?: boolean }) => boolean
  cancelPendingOrder: () => Promise<CancelPendingOrderResult>
  // Resoluções locais disparadas pelo acompanhamento de status do pedido (polling/SSE).
  // Não chamam o backend — apenas refletem no frontend o que o ERP já decidiu.
  markOrderConfirmedLocally: () => void
  markOrderCancelledLocally: () => void
  orderCancelledNotice: boolean
  dismissOrderCancelledNotice: () => void
  isSkuLoading: (skuCode: string) => boolean
  isReservationLoading: (reservationId: string) => boolean
}
