export type OrderCustomerInput = {
  name: string
  phone: string
  city: string
}

export type CreateOrderInput = {
  customer: OrderCustomerInput
  reservations: string[]
  notes?: string
}

export type CreateOrderResponse = {
  orderId: number
  status: string
  whatsappUrl: string
}

export type PendingOrderItem = {
  skuCode: string
  name: string
  image: string
  price: number
  quantity: number
}

export type PendingOrder = {
  orderId: number
  status: string
  whatsappUrl: string
  customer: OrderCustomerInput
  notes?: string
  items: PendingOrderItem[]
  subtotal: number
  createdAt: string
}
