// Espelha o enum OrderStatus do ERP (br.com.erp.api.order.domain.enumerated).
export type OrderStatus =
  | 'PENDING_PAYMENT' // criado — aguardando confirmação manual do pagamento (reserva RESERVED)
  | 'PAID' // pagamento confirmado — reserva consumida (estoque baixado)
  | 'DELIVERED' // pedido entregue manualmente
  | 'CANCELLED' // cancelado por falta de pagamento — reserva liberada
  | 'EXPIRED' // expirado após 24h sem pagamento — reserva liberada
  | 'RETURNED' // devolvido após pago/entregue — estoque reposto

export type OrderCustomerInput = {
  name: string
  phone: string
  city: string
}

export type DeliveryAddress = {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  // city e state são fixos no backend (Pirenópolis - GO), não enviados.
}

export type CreateOrderInput = {
  customer: OrderCustomerInput
  reservations: string[]
  deliveryAddress: DeliveryAddress
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
  deliveryAddress: DeliveryAddress
  notes?: string
  items: PendingOrderItem[]
  subtotal: number
  createdAt: string
}
