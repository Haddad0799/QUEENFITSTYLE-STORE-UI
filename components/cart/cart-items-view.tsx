'use client'

import Image from 'next/image'
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/api'
import { useCart } from '@/src/hooks/useCart'
import {
  formatReservationTimeLeft,
  getReservationTimeLeftMs,
} from '@/src/utils/reservation.utils'

export function CartItemsView() {
  const {
    items,
    subtotal,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    goToCheckout,
    isSkuLoading,
  } = useCart()
  const [now, setNow] = useState(Date.now())
  const [cartError, setCartError] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadingItem = useMemo(
    () => items.some((item) => isSkuLoading(item.skuCode)),
    [isSkuLoading, items]
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  function showError(message: string | undefined) {
    if (!message) return
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    setCartError(message)
    errorTimerRef.current = setTimeout(() => setCartError(null), 5000)
  }

  return (
    <>
      {cartError && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
          <p className="text-sm text-amber-800">{cartError}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {items.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-foreground">Seu carrinho está vazio.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Os itens adicionados aparecem aqui com o tempo restante da reserva.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => {
              const isLoading = isSkuLoading(item.skuCode)
              const timeLeftMs = getReservationTimeLeftMs(item, now)

              return (
                <div key={item.skuCode} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-[#f3f2ef]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isLoading}
                          onClick={() => {
                            void removeItem(item.skuCode).then((r) => showError(r.message))
                          }}
                          className="shrink-0 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover item</span>
                        </Button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-border/80">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={isLoading}
                            onClick={() => {
                              void decreaseQuantity(item.skuCode).then((r) => showError(r.message))
                            }}
                            className="rounded-full"
                          >
                            <Minus className="h-4 w-4" />
                            <span className="sr-only">Diminuir quantidade</span>
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={isLoading}
                            onClick={() => {
                              void increaseQuantity(item.skuCode).then((r) => showError(r.message))
                            }}
                            className="rounded-full"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Aumentar quantidade</span>
                          </Button>
                        </div>

                        <p className="text-right text-sm font-semibold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        {isLoading
                          ? 'Sincronizando reserva...'
                          : `Reserva expira em ${formatReservationTimeLeft(timeLeftMs)}`}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border/70 px-6 py-5">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={items.length === 0 || hasLoadingItem}
          onClick={goToCheckout}
          className="w-full"
        >
          Finalizar compra
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}
