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
import { toast } from '@/hooks/use-toast'
import {
  getInventoryErrorMessage,
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
  createPendingReservationId,
  createReservationWindow,
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
  // - localStorage guarda apenas reservas confirmadas pelo ERP; updates otimistas ficam
  //   em memória até a API responder, então um refresh nunca persiste uma reserva fake.
  // - cada reserva recebe TTL local de 2 horas. Ao hidratar, voltar para a aba ou
  //   atingir 00:00, itens vencidos são removidos e a release é reenviada em background.
  // - BroadcastChannel + storage event sincronizam múltiplas abas, e locks curtos em
  //   localStorage evitam duas abas criando reservas concorrentes para o mesmo SKU.
  // - qualquer mudança de quantidade libera a reserva antiga e cria uma nova, porque o
  //   backend reserva uma quantidade fechada e não há endpoint de resize de reserva.
  const ownerIdRef = useRef(createCartLockOwnerId())
  const operationQueuesRef = useRef(new Map<string, Promise<unknown>>())
  const activeOperationsRef = useRef(0)
  const pendingQuantityRef = useRef(new Map<string, number>())
  const quantityTimerRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [isCartOpen, setCartOpenState] = useState(false)
  const [step, setStep] = useState<CartStep>('cart')
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)
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

  const enqueueOperation = useCallback(
    async <T,>(queueKey: string, operation: () => Promise<T>) => {
      const previousOperation = operationQueuesRef.current.get(queueKey) ?? Promise.resolve()
      activeOperationsRef.current += 1

      const nextOperation = previousOperation
        .catch(() => undefined)
        .then(operation)
        .finally(() => {
          if (operationQueuesRef.current.get(queueKey) === nextOperation) {
            operationQueuesRef.current.delete(queueKey)
          }

          activeOperationsRef.current = Math.max(0, activeOperationsRef.current - 1)
        })

      operationQueuesRef.current.set(queueKey, nextOperation)

      return nextOperation
    },
    []
  )

  const releaseReservationSafely = useCallback(async (reservationId: string) => {
    if (isPendingReservationId(reservationId)) {
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

  const removeExpiredItems = useCallback(
    (options: { notify?: boolean } = {}) => {
      const { valid, expired } = splitCartItemsByExpiration(itemsRef.current)

      if (expired.length === 0) {
        return
      }

      replaceItems(valid)
      releaseReservationsInBackground(expired)

      if (options.notify) {
        toast({
          title: 'Reserva expirada',
          description: 'Removemos do carrinho os itens cujo tempo de reserva acabou.',
          variant: 'destructive',
        })
      }
    },
    [releaseReservationsInBackground, replaceItems]
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

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const intervalId = window.setInterval(() => {
      removeExpiredItems({ notify: true })
    }, 1000)

    function handleReturnToTab() {
      removeExpiredItems({ notify: true })
    }

    window.addEventListener('focus', handleReturnToTab)
    document.addEventListener('visibilitychange', handleReturnToTab)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleReturnToTab)
      document.removeEventListener('visibilitychange', handleReturnToTab)
    }
  }, [isHydrated, removeExpiredItems])

  const reserveNewItem = useCallback(
    async (
      latestItems: CartItem[],
      input: Required<AddCartItemInput>
    ): Promise<CartMutationOutcome> => {
      try {
        const reservation = await reserveStock(input.skuCode, input.quantity)
        const reservationWindow = createReservationWindow()
        const nextItem: CartItem = {
          skuCode: reservation.skuCode,
          name: input.name,
          image: input.image,
          price: input.price,
          quantity: reservation.quantity,
          reservationId: reservation.reservationId,
          ...reservationWindow,
        }

        replaceItems([...latestItems.filter((item) => item.skuCode !== input.skuCode), nextItem])

        return {
          ok: true,
        }
      } catch (error) {
        replaceItems(latestItems)

        return {
          ok: false,
          message: getInventoryErrorMessage(error),
        }
      }
    },
    [replaceItems]
  )

  const replaceReservationQuantity = useCallback(
    async (
      latestItems: CartItem[],
      currentItem: CartItem,
      nextQuantity: number
    ): Promise<CartMutationOutcome> => {
      const normalizedQuantity = Math.max(0, Math.floor(nextQuantity))

      if (normalizedQuantity === 0) {
        try {
          await releaseReservationSafely(currentItem.reservationId)
          replaceItems(latestItems.filter((item) => item.skuCode !== currentItem.skuCode))

          return {
            ok: true,
          }
        } catch (error) {
          replaceItems(latestItems)

          return {
            ok: false,
            message: getInventoryErrorMessage(error),
          }
        }
      }

      try {
        // The backend reservation owns an immutable quantity. Changing quantity by
        // releasing and recreating avoids showing more units in the UI than the ERP
        // has actually reserved for this cart.
        await releaseReservationSafely(currentItem.reservationId)
      } catch (error) {
        replaceItems(latestItems)

        return {
          ok: false,
          message: getInventoryErrorMessage(error),
        }
      }

      try {
        const reservation = await reserveStock(currentItem.skuCode, normalizedQuantity)
        const reservationWindow = createReservationWindow()
        const nextItems = latestItems.map((item) =>
          item.skuCode === currentItem.skuCode
            ? {
                ...item,
                quantity: reservation.quantity,
                reservationId: reservation.reservationId,
                ...reservationWindow,
              }
            : item
        )

        replaceItems(nextItems)

        return {
          ok: true,
        }
      } catch (error) {
        try {
          const rollbackReservation = await reserveStock(
            currentItem.skuCode,
            currentItem.quantity
          )
          const reservationWindow = createReservationWindow()
          const rollbackItems = latestItems.map((item) =>
            item.skuCode === currentItem.skuCode
              ? {
                  ...currentItem,
                  quantity: rollbackReservation.quantity,
                  reservationId: rollbackReservation.reservationId,
                  ...reservationWindow,
                }
              : item
          )

          replaceItems(rollbackItems)
        } catch {
          replaceItems(latestItems.filter((item) => item.skuCode !== currentItem.skuCode))
        }

        return {
          ok: false,
          message: getInventoryErrorMessage(error),
        }
      }
    },
    [releaseReservationSafely, replaceItems]
  )

  const runSkuOperation = useCallback(
    async (
      skuCode: string,
      operation: () => Promise<CartMutationOutcome>
    ): Promise<CartMutationOutcome> => {
      setSkuLoading(skuCode, true)

      try {
        return await enqueueOperation(`sku:${skuCode}`, () =>
          withCartOperationLock(`sku:${skuCode}`, ownerIdRef.current, operation)
        )
      } catch (error) {
        return {
          ok: false,
          message: getInventoryErrorMessage(error),
        }
      } finally {
        setSkuLoading(skuCode, false)
      }
    },
    [enqueueOperation, setSkuLoading]
  )

  const addItemMutation = useMutation({
    mutationFn: async (input: AddCartItemInput): Promise<CartMutationOutcome> => {
      if (pendingOrderRef.current) {
        setCartOpenState(true)
        return {
          ok: false,
          message: 'Você tem um pedido em andamento. Conclua ou cancele para adicionar novos itens.',
        }
      }

      const quantity = Math.max(1, Math.floor(input.quantity ?? 1))
      const completeInput: Required<AddCartItemInput> = {
        ...input,
        quantity,
      }
      const previousItems = itemsRef.current
      const existingItem = previousItems.find((item) => item.skuCode === input.skuCode)
      const reservationWindow = createReservationWindow()
      const optimisticItem: CartItem = existingItem
        ? {
            ...existingItem,
            quantity: existingItem.quantity + quantity,
            reservationId: createPendingReservationId(input.skuCode),
            ...reservationWindow,
          }
        : {
            skuCode: input.skuCode,
            name: input.name,
            image: input.image,
            price: input.price,
            quantity,
            reservationId: createPendingReservationId(input.skuCode),
            ...reservationWindow,
          }

      replaceItems(
        [
          ...previousItems.filter((item) => item.skuCode !== input.skuCode),
          optimisticItem,
        ],
        { persist: false }
      )

      const result = await runSkuOperation(input.skuCode, async () => {
        const { valid: latestItems, expired } = splitCartItemsByExpiration(readCartItems())

        if (expired.length > 0) {
          saveCartItems(latestItems, ownerIdRef.current)
          releaseReservationsInBackground(expired)
        }

        const latestExistingItem = latestItems.find((item) => item.skuCode === input.skuCode)

        if (latestExistingItem) {
          return replaceReservationQuantity(
            latestItems,
            latestExistingItem,
            latestExistingItem.quantity + quantity
          )
        }

        return reserveNewItem(latestItems, completeInput)
      })

      if (result.ok) {
        setCartOpen(true)
      }

      return result
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

      if (nextQuantity <= 0) {
        replaceItems(previousItems.filter((item) => item.skuCode !== skuCode), {
          persist: false,
        })
      } else {
        const reservationWindow = createReservationWindow()

        replaceItems(
          previousItems.map((item) =>
            item.skuCode === skuCode
              ? {
                  ...item,
                  quantity: nextQuantity,
                  reservationId: createPendingReservationId(skuCode),
                  ...reservationWindow,
                }
              : item
          ),
          { persist: false }
        )
      }

      const result = await runSkuOperation(skuCode, async () => {
        const { valid: latestItems, expired } = splitCartItemsByExpiration(readCartItems())

        if (expired.length > 0) {
          saveCartItems(latestItems, ownerIdRef.current)
          releaseReservationsInBackground(expired)
        }

        const latestItem = latestItems.find((item) => item.skuCode === skuCode)

        if (!latestItem) {
          replaceItems(latestItems)

          return {
            ok: false,
            message: 'A reserva deste item expirou.',
          }
        }

        return replaceReservationQuantity(latestItems, latestItem, nextQuantity)
      })

      return result
    },
    [releaseReservationsInBackground, replaceItems, replaceReservationQuantity, runSkuOperation]
  )

  const adjustQuantityDebounced = useCallback(
    (skuCode: string, delta: number) => {
      const currentTarget =
        pendingQuantityRef.current.get(skuCode) ??
        itemsRef.current.find((item) => item.skuCode === skuCode)?.quantity ??
        0
      const nextTarget = Math.max(0, currentTarget + delta)

      if (nextTarget === 0) {
        // Remoção não tem debounce: changeQuantity precisa encontrar o item
        // em itemsRef para ler o reservationId e liberar a reserva no ERP.
        const existingTimer = quantityTimerRef.current.get(skuCode)
        if (existingTimer) clearTimeout(existingTimer)
        quantityTimerRef.current.delete(skuCode)
        pendingQuantityRef.current.delete(skuCode)
        void changeQuantity(skuCode, 0)
        return
      }

      pendingQuantityRef.current.set(skuCode, nextTarget)

      replaceItems(
        itemsRef.current.map((item) =>
          item.skuCode === skuCode ? { ...item, quantity: nextTarget } : item
        ),
        { persist: false }
      )

      const existingTimer = quantityTimerRef.current.get(skuCode)
      if (existingTimer) clearTimeout(existingTimer)

      quantityTimerRef.current.set(
        skuCode,
        setTimeout(() => {
          const target = pendingQuantityRef.current.get(skuCode)
          pendingQuantityRef.current.delete(skuCode)
          quantityTimerRef.current.delete(skuCode)
          if (target !== undefined) {
            void changeQuantity(skuCode, target)
          }
        }, 600)
      )
    },
    [changeQuantity, replaceItems]
  )

  const increaseQuantityMutation = useMutation({
    mutationFn: (skuCode: string) => {
      adjustQuantityDebounced(skuCode, +1)
      return Promise.resolve({ ok: true } as CartOperationResult)
    },
  })

  const decreaseQuantityMutation = useMutation({
    mutationFn: (skuCode: string) => {
      adjustQuantityDebounced(skuCode, -1)
      return Promise.resolve({ ok: true } as CartOperationResult)
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
        const order = await createOrder({
          customer: input.customer,
          reservations: previousItems.map((item) => item.reservationId),
          notes: input.notes,
        })

        const orderSubtotal = previousItems.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )

        const nextPendingOrder: PendingOrder = {
          orderId: order.orderId,
          status: order.status,
          whatsappUrl: order.whatsappUrl,
          customer: input.customer,
          notes: input.notes,
          items: previousItems.map((item) => ({
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

  const openWhatsAppAndComplete = useCallback(() => {
    const pending = pendingOrderRef.current
    if (!pending) return

    const targetUrl = pending.whatsappUrl

    // Clean up before navigating. If the new tab is blocked and we fall back
    // to a same-tab navigation, the cleanup must have already happened —
    // otherwise the cart would survive the redirect and a refresh of the
    // store would show stale local state.
    finalizePendingOrderLocally()
    setCartOpenState(false)

    if (typeof window === 'undefined') return

    const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer')
    if (!popup) {
      window.location.href = targetUrl
    }
  }, [finalizePendingOrderLocally])

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
      isSkuLoading: (skuCode) => loadingSkuCodes.includes(skuCode),
      isReservationLoading: (reservationId) =>
        loadingReservationIds.includes(reservationId),
    }),
    [
      addItemMutation,
      cancelPendingOrderMutation,
      decreaseQuantityMutation,
      increaseQuantityMutation,
      isHydrated,
      isCartOpen,
      items,
      loadingReservationIds,
      loadingSkuCodes,
      openWhatsAppAndComplete,
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
