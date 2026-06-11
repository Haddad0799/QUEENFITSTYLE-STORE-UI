'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import {
  isReservationAlreadyGone,
  releaseReservation,
  reserveStock,
} from '@/src/services/inventory.service'
import {
  clearCartItems,
  createCartLockOwnerId,
  readCartItems,
  saveCartItems,
  subscribeToCartChanges,
  withCartOperationLock,
} from '@/src/services/cart.service'
import {
  cancelOrder,
  createOrder,
  getOrderErrorMessage,
  isOrderAlreadyGone,
} from '@/src/services/orders.service'
import {
  clearPendingOrder,
  readPendingOrder,
  savePendingOrder,
  subscribeToPendingOrderChanges,
} from '@/src/services/pending-order.service'
import type {
  AddCartItemInput,
  CancelPendingOrderResult,
  CartContextValue,
  CartItem,
  CartOperationResult,
  CartStep,
  SubmitOrderInput,
  SubmitOrderResult,
} from '@/src/types/cart.types'
import type { PendingOrder } from '@/src/types/order.types'
import {
  createDraftReservationId,
  createReservationWindow,
  isDraftReservationId,
  isPendingReservationId,
  splitCartItemsByExpiration,
} from '@/src/utils/reservation.utils'

type CartMutationOutcome = CartOperationResult

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            retry: 0,
          },
          queries: {
            retry: 1,
            staleTime: 30000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <CartStateProvider>{children}</CartStateProvider>
      <Toaster />
    </QueryClientProvider>
  )
}

function CartStateProvider({ children }: { children: ReactNode }) {
  // Estratégia do carrinho:
  // - O carrinho é puramente local: adicionar itens e alterar quantidades nunca
  //   tocam o backend de estoque. Cada item vive como "rascunho" (sem reserva
  //   ativa) enquanto está no carrinho.
  // - A reserva de estoque acontece de uma vez só na confirmação do pedido
  //   (submitOrderMutation), logo antes de criar o pedido e redirecionar para o
  //   WhatsApp. É o único ponto que chama o estoque.
  // - localStorage persiste os itens locais; BroadcastChannel + storage event
  //   sincronizam múltiplas abas. As reservas reais (criadas na confirmação)
  //   pertencem ao pedido a partir daí — e expiram sozinhas pelo TTL do ERP.
  const ownerIdRef = useRef(createCartLockOwnerId())
  const activeOperationsRef = useRef(0)
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCartOpen, setCartOpenState] = useState(false)
  const [step, setStep] = useState<CartStep>('cart')
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)
  const [orderCancelledNotice, setOrderCancelledNotice] = useState(false)
  const [loadingSkuCodes, setLoadingSkuCodes] = useState<string[]>([])
  const [loadingReservationIds, setLoadingReservationIds] = useState<string[]>([])
  const itemsRef = useRef<CartItem[]>(items)
  const pendingOrderRef = useRef<PendingOrder | null>(null)

  useEffect(() => {
    pendingOrderRef.current = pendingOrder
  }, [pendingOrder])

  const setCartOpen = useCallback((open: boolean) => {
    setCartOpenState(open)
    if (!open) {
      // When a pending order exists, the next open should still land on the
      // pending-order step — never reset back to 'cart' until the order is
      // resolved (opened in WhatsApp or cancelled).
      setStep(pendingOrderRef.current ? 'pending-order' : 'cart')
    }
  }, [])

  const applyPendingOrder = useCallback((order: PendingOrder | null) => {
    pendingOrderRef.current = order
    setPendingOrder(order)
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const replaceItems = useCallback(
    (nextItems: CartItem[], options: { persist?: boolean } = {}) => {
      const shouldPersist = options.persist ?? true

      itemsRef.current = nextItems
      setItems(nextItems)

      if (shouldPersist) {
        saveCartItems(nextItems, ownerIdRef.current)
      }
    },
    []
  )

  const setSkuLoading = useCallback((skuCode: string, loading: boolean) => {
    setLoadingSkuCodes((current) => {
      if (loading) {
        return current.includes(skuCode) ? current : [...current, skuCode]
      }

      return current.filter((code) => code !== skuCode)
    })
  }, [])

  const setReservationLoading = useCallback(
    (reservationId: string, loading: boolean) => {
      setLoadingReservationIds((current) => {
        if (loading) {
          return current.includes(reservationId) ? current : [...current, reservationId]
        }

        return current.filter((currentReservationId) => currentReservationId !== reservationId)
      })
    },
    []
  )

  const releaseReservationSafely = useCallback(async (reservationId: string) => {
    // Ids "pending" (otimista, em voo) e "draft" (sem reserva no ERP) não têm
    // reserva real — não há nada para liberar.
    if (isPendingReservationId(reservationId) || isDraftReservationId(reservationId)) {
      return
    }

    try {
      await releaseReservation(reservationId)
    } catch (error) {
      if (!isReservationAlreadyGone(error)) {
        throw error
      }
    }
  }, [])

  const releaseReservationsInBackground = useCallback(
    (expiredItems: CartItem[]) => {
      expiredItems.forEach((item) => {
        void withCartOperationLock(
          `reservation:${item.reservationId}`,
          ownerIdRef.current,
          () => releaseReservationSafely(item.reservationId),
          { waitMs: 500 }
        ).catch(() => {
          // Expired reservations are already unusable for checkout. The next visit will
          // retry the release, while the UI stays consistent by removing them locally.
        })
      })
    },
    [releaseReservationSafely]
  )

  useEffect(() => {
    const persistedItems = readCartItems()
    const { valid, expired } = splitCartItemsByExpiration(persistedItems)

    itemsRef.current = valid
    setItems(valid)

    const persistedPendingOrder = readPendingOrder()
    if (persistedPendingOrder) {
      pendingOrderRef.current = persistedPendingOrder
      setPendingOrder(persistedPendingOrder)
      // Recovery: if a pending order survived a reload/crash, route the
      // drawer to the pending step so the user can complete or cancel it
      // before we attempt anything else.
      setStep('pending-order')
    }

    setIsHydrated(true)

    // Itens locais (rascunhos) nunca expiram; este release só alcança reservas
    // reais legadas (de versões anteriores) que porventura tenham vencido.
    if (expired.length > 0) {
      saveCartItems(valid, ownerIdRef.current)
      releaseReservationsInBackground(expired)
    }
  }, [releaseReservationsInBackground])

  useEffect(() => {
    if (!isHydrated) return

    return subscribeToPendingOrderChanges(() => {
      const nextPendingOrder = readPendingOrder()
      pendingOrderRef.current = nextPendingOrder
      setPendingOrder(nextPendingOrder)
      setStep(nextPendingOrder ? 'pending-order' : 'cart')
    }, ownerIdRef.current)
  }, [isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    return subscribeToCartChanges(() => {
      if (activeOperationsRef.current > 0) {
        return
      }

      const { valid, expired } = splitCartItemsByExpiration(readCartItems())
      itemsRef.current = valid
      setItems(valid)

      if (expired.length > 0) {
        saveCartItems(valid, ownerIdRef.current)
        releaseReservationsInBackground(expired)
      }
    }, ownerIdRef.current)
  }, [isHydrated, releaseReservationsInBackground])

  const addItemMutation = useMutation({
    mutationFn: async (input: AddCartItemInput): Promise<CartMutationOutcome> => {
      if (pendingOrderRef.current) {
        setCartOpenState(true)
        return {
          ok: false,
          message:
            'Você tem um pedido em andamento. Conclua ou cancele para adicionar novos itens.',
        }
      }

      const quantity = Math.max(1, Math.floor(input.quantity ?? 1))
      const previousItems = itemsRef.current
      const existingItem = previousItems.find((item) => item.skuCode === input.skuCode)

      // Apenas estado local: o item entra como rascunho, sem reserva no estoque.
      // A reserva é feita só na confirmação do pedido.
      const nextItem: CartItem = existingItem
        ? {
            ...existingItem,
            quantity: existingItem.quantity + quantity,
            reservationId: createDraftReservationId(input.skuCode),
            ...createReservationWindow(),
          }
        : {
            skuCode: input.skuCode,
            name: input.name,
            image: input.image,
            price: input.price,
            quantity,
            reservationId: createDraftReservationId(input.skuCode),
            ...createReservationWindow(),
          }

      replaceItems([
        ...previousItems.filter((item) => item.skuCode !== input.skuCode),
        nextItem,
      ])

      setCartOpen(true)

      return { ok: true }
    },
  })

  const changeQuantity = useCallback(
    async (skuCode: string, nextQuantity: number): Promise<CartMutationOutcome> => {
      if (pendingOrderRef.current) {
        return {
          ok: false,
          message: 'Pedido em andamento. Conclua ou cancele antes de alterar o carrinho.',
        }
      }

      const previousItems = itemsRef.current
      const currentItem = previousItems.find((item) => item.skuCode === skuCode)

      if (!currentItem) {
        return {
          ok: false,
          message: 'Item não encontrado no carrinho.',
        }
      }

      // Mudança de quantidade é só local; o estoque só é tocado na confirmação.
      if (nextQuantity <= 0) {
        replaceItems(previousItems.filter((item) => item.skuCode !== skuCode))
      } else {
        replaceItems(
          previousItems.map((item) =>
            item.skuCode === skuCode
              ? {
                  ...item,
                  quantity: Math.floor(nextQuantity),
                  reservationId: createDraftReservationId(skuCode),
                  ...createReservationWindow(),
                }
              : item
          )
        )
      }

      return { ok: true }
    },
    [replaceItems]
  )

  const increaseQuantityMutation = useMutation({
    mutationFn: (skuCode: string) => {
      const current =
        itemsRef.current.find((item) => item.skuCode === skuCode)?.quantity ?? 0
      return changeQuantity(skuCode, current + 1)
    },
  })

  const decreaseQuantityMutation = useMutation({
    mutationFn: (skuCode: string) => {
      const current =
        itemsRef.current.find((item) => item.skuCode === skuCode)?.quantity ?? 0
      return changeQuantity(skuCode, current - 1)
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (skuCode: string) => changeQuantity(skuCode, 0),
  })

  const submitOrderMutation = useMutation({
    mutationFn: async (input: SubmitOrderInput): Promise<SubmitOrderResult> => {
      // Idempotency guard: if a pending order already exists locally (e.g. user
      // resubmitted, two tabs raced, or the network call succeeded but the UI
      // didn't see the response), don't create another order. Reuse the one
      // we already have and let the user complete or cancel it.
      const existingPendingOrder = pendingOrderRef.current
      if (existingPendingOrder) {
        setStep('pending-order')
        setCartOpenState(true)
        return {
          ok: true,
          order: {
            orderId: existingPendingOrder.orderId,
            status: existingPendingOrder.status,
            whatsappUrl: existingPendingOrder.whatsappUrl,
          },
        }
      }

      const previousItems = itemsRef.current

      if (previousItems.length === 0) {
        return {
          ok: false,
          message: 'Seu carrinho está vazio.',
        }
      }

      const { valid: latestItems, expired } = splitCartItemsByExpiration(previousItems)

      if (expired.length > 0) {
        replaceItems(latestItems)
        releaseReservationsInBackground(expired)
        return {
          ok: false,
          message: 'Uma ou mais reservas expiraram. Revise o carrinho.',
        }
      }

      previousItems.forEach((item) => {
        setSkuLoading(item.skuCode, true)
        setReservationLoading(item.reservationId, true)
      })

      try {
        // Aqui é o único ponto que reserva estoque: cada item do carrinho é um
        // rascunho (sem reserva viva), então reservamos todos antes de criar o
        // pedido. Os que não puderem ser reservados (sem estoque) permanecem como
        // rascunho e abortam o envio para o cliente revisar o carrinho.
        const reservedItems: CartItem[] = []
        const unavailableSkus: string[] = []

        for (const item of previousItems) {
          if (!isDraftReservationId(item.reservationId)) {
            reservedItems.push(item)
            continue
          }

          try {
            const reservation = await reserveStock(item.skuCode, item.quantity)
            reservedItems.push({
              ...item,
              quantity: reservation.quantity,
              reservationId: reservation.reservationId,
              ...createReservationWindow(),
            })
          } catch {
            reservedItems.push(item)
            unavailableSkus.push(item.skuCode)
          }
        }

        // Persiste o resultado: reservas feitas deixam de ser rascunho; os
        // indisponíveis seguem como rascunho. Vale tanto no sucesso quanto na falha.
        replaceItems(reservedItems)

        if (unavailableSkus.length > 0) {
          setStep('cart')
          return {
            ok: false,
            message:
              'Alguns itens não estão mais disponíveis no estoque. Revise o carrinho e tente novamente.',
          }
        }

        const order = await createOrder({
          customer: input.customer,
          reservations: reservedItems.map((item) => item.reservationId),
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
        })

        const orderSubtotal = reservedItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )

        const nextPendingOrder: PendingOrder = {
          orderId: order.orderId,
          status: order.status,
          whatsappUrl: order.whatsappUrl,
          customer: input.customer,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
          items: reservedItems.map((item) => ({
            skuCode: item.skuCode,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal: orderSubtotal,
          createdAt: new Date().toISOString(),
        }

        // Backend owns the order from this point on. We keep the cart intact
        // locally so the customer can re-open WhatsApp from the recovery
        // screen if anything goes wrong — and so a reload doesn't trigger a
        // duplicate POST. The cart is only emptied once they explicitly
        // confirm via "Abrir WhatsApp" or cancel the order.
        savePendingOrder(nextPendingOrder, ownerIdRef.current)
        applyPendingOrder(nextPendingOrder)
        setOrderCancelledNotice(false)
        setStep('pending-order')

        return { ok: true, order }
      } catch (error) {
        return {
          ok: false,
          message: getOrderErrorMessage(error),
        }
      } finally {
        previousItems.forEach((item) => {
          setSkuLoading(item.skuCode, false)
          setReservationLoading(item.reservationId, false)
        })
      }
    },
  })

  const finalizePendingOrderLocally = useCallback(() => {
    clearPendingOrder(ownerIdRef.current)
    applyPendingOrder(null)
    clearCartItems(ownerIdRef.current)
    replaceItems([], { persist: false })
    setStep('cart')
  }, [applyPendingOrder, replaceItems])

  const markOrderConfirmedLocally = useCallback(() => {
    // O ERP confirmou o pedido (reservas já viraram venda). Limpamos carrinho e
    // pedido pendente localmente e fechamos o drawer — a navegação para a tela
    // de sucesso fica a cargo de quem observa o status.
    finalizePendingOrderLocally()
    setOrderCancelledNotice(false)
    setCartOpenState(false)
  }, [finalizePendingOrderLocally])

  const markOrderCancelledLocally = useCallback(() => {
    // O ERP cancelou/expirou o pedido — NÃO chamamos o cancel de novo. As reservas
    // no ERP já foram liberadas, então os reservationId atuais estão mortos: tentar
    // liberá-los de novo falharia (não retornam 404/410) e prenderia o item no
    // carrinho. Convertemos cada item em "rascunho" (sem reserva ativa). Assim o
    // cliente pode remover/editar sem chamar o ERP, e a reserva é refeita quando
    // ele finalizar novamente.
    clearPendingOrder(ownerIdRef.current)
    applyPendingOrder(null)
    replaceItems(
      itemsRef.current.map((item) => ({
        ...item,
        reservationId: createDraftReservationId(item.skuCode),
      }))
    )
    setStep('cart')
    setOrderCancelledNotice(true)
    setCartOpenState(true)
  }, [applyPendingOrder, replaceItems])

  const dismissOrderCancelledNotice = useCallback(() => {
    setOrderCancelledNotice(false)
  }, [])

  const openWhatsAppAndComplete = useCallback(
    (options: { allowSameTabFallback?: boolean } = {}): boolean => {
      // allowSameTabFallback=true (clique no botão): se o popup for bloqueado,
      // navegamos na mesma aba. allowSameTabFallback=false (auto-abertura logo
      // após criar o pedido): se for bloqueado, NÃO forçamos a navegação —
      // mantemos o pedido pendente para o botão "Abrir WhatsApp" ser o fallback.
      const { allowSameTabFallback = true } = options
      const pending = pendingOrderRef.current
      if (!pending) return false

      if (typeof window === 'undefined') return false

      const targetUrl = pending.whatsappUrl
      const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer')

      if (!popup && !allowSameTabFallback) {
        // Auto-abertura bloqueada (sem gesto do usuário). Deixa tudo como está.
        return false
      }

      // Clean up before navigating. If the new tab is blocked and we fall back
      // to a same-tab navigation, the cleanup must have already happened —
      // otherwise the cart would survive the redirect and a refresh of the
      // store would show stale local state.
      finalizePendingOrderLocally()
      setCartOpenState(false)

      if (!popup) {
        window.location.href = targetUrl
      }

      return true
    },
    [finalizePendingOrderLocally]
  )

  const cancelPendingOrderMutation = useMutation({
    mutationFn: async (): Promise<CancelPendingOrderResult> => {
      const pending = pendingOrderRef.current
      if (!pending) {
        return { ok: false, message: 'Nenhum pedido pendente para cancelar.' }
      }

      try {
        await cancelOrder(pending.orderId)
      } catch (error) {
        // Treat 404/410 as already-cancelled on the backend — we proceed to
        // clean up local state because there's nothing left to reconcile.
        if (!isOrderAlreadyGone(error)) {
          return {
            ok: false,
            message: getOrderErrorMessage(error),
          }
        }
      }

      finalizePendingOrderLocally()
      return { ok: true }
    },
  })

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  )
  const totalItems = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isHydrated,
      isCartOpen,
      totalItems,
      subtotal,
      step,
      pendingOrder,
      isSubmittingOrder: submitOrderMutation.isPending,
      isCancellingOrder: cancelPendingOrderMutation.isPending,
      setCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      goToCheckout: () => setStep('checkout'),
      backToCart: () => setStep('cart'),
      addItem: (item) => addItemMutation.mutateAsync(item),
      increaseQuantity: (skuCode) => increaseQuantityMutation.mutateAsync(skuCode),
      decreaseQuantity: (skuCode) => decreaseQuantityMutation.mutateAsync(skuCode),
      removeItem: (skuCode) => removeItemMutation.mutateAsync(skuCode),
      submitOrder: (input) => submitOrderMutation.mutateAsync(input),
      openWhatsAppAndComplete,
      cancelPendingOrder: () => cancelPendingOrderMutation.mutateAsync(),
      markOrderConfirmedLocally,
      markOrderCancelledLocally,
      orderCancelledNotice,
      dismissOrderCancelledNotice,
      isSkuLoading: (skuCode) => loadingSkuCodes.includes(skuCode),
      isReservationLoading: (reservationId) =>
        loadingReservationIds.includes(reservationId),
    }),
    [
      addItemMutation,
      cancelPendingOrderMutation,
      decreaseQuantityMutation,
      dismissOrderCancelledNotice,
      increaseQuantityMutation,
      isHydrated,
      isCartOpen,
      items,
      loadingReservationIds,
      loadingSkuCodes,
      markOrderCancelledLocally,
      markOrderConfirmedLocally,
      openWhatsAppAndComplete,
      orderCancelledNotice,
      pendingOrder,
      removeItemMutation,
      setCartOpen,
      step,
      submitOrderMutation,
      subtotal,
      totalItems,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
