'use client'

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CartItemsView } from '@/components/cart/cart-items-view'
import { CheckoutForm } from '@/components/cart/checkout-form'
import { PendingOrderView } from '@/components/cart/pending-order-view'
import { useCart } from '@/src/hooks/useCart'

const HEADERS: Record<
  'cart' | 'checkout' | 'pending-order',
  { title: string; description: string }
> = {
  cart: {
    title: 'Carrinho',
    description: 'Reservas de estoque ativas por 2 horas.',
  },
  checkout: {
    title: 'Finalizar pedido',
    description: 'Preencha seus dados para confirmar o pedido pelo WhatsApp.',
  },
  'pending-order': {
    title: 'Pedido pendente',
    description:
      'Falta apenas abrir o WhatsApp para a nossa equipe confirmar.',
  },
}

export function CartSheetContent() {
  const { step } = useCart()
  const { title, description } = HEADERS[step]

  return (
    <SheetContent className="w-[92vw] max-w-[420px] gap-0 px-0 sm:max-w-[440px]">
      <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
        <SheetTitle className="text-xl tracking-[0.14em]">{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>

      {step === 'pending-order' ? (
        <PendingOrderView />
      ) : step === 'checkout' ? (
        <CheckoutForm />
      ) : (
        <CartItemsView />
      )}
    </SheetContent>
  )
}
