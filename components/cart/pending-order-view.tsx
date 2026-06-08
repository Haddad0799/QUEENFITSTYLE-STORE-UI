'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  X,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/api'
import { useCart } from '@/src/hooks/useCart'
import { useOrderStatusPolling } from '@/hooks/use-order-status-polling'
import {
  copyToClipboard,
  getWhatsAppMessage,
} from '@/src/utils/whatsapp.utils'

export function PendingOrderView() {
  const router = useRouter()
  const {
    pendingOrder,
    openWhatsAppAndComplete,
    cancelPendingOrder,
    isCancellingOrder,
    markOrderConfirmedLocally,
    markOrderCancelledLocally,
  } = useCart()
  const orderId = pendingOrder?.orderId ?? null

  // Acompanha o status do pedido enquanto este modal estiver montado. O hook faz
  // um backoff curto logo após a criação (captando confirmações rápidas durante
  // a conversa no WhatsApp) e depois só re-checa quando a aba recebe foco — o
  // aviso definitivo de confirmação chega pelo próprio WhatsApp.
  // Para migrar para SSE no futuro, basta trocar a importação do hook acima.
  useOrderStatusPolling({
    orderId,
    enabled: orderId !== null,
    onStatusChange: (status) => {
      // PAID = pagamento confirmado pela vendedora no ERP. DELIVERED implica
      // que já passou por PAID (caso a cliente só volte à aba bem depois).
      if (status === 'PAID' || status === 'DELIVERED') {
        markOrderConfirmedLocally()
        router.push(
          orderId !== null
            ? `/pedido/confirmado?pedido=${orderId}`
            : '/pedido/confirmado'
        )
        return
      }

      if (status === 'RETURNED') {
        // Pedido foi pago e depois devolvido no ERP — as reservas já foram
        // consumidas/repostas do lado de lá. Só limpamos o carrinho local (sem
        // tela de sucesso); senão o item devolvido fica preso no carrinho.
        markOrderConfirmedLocally()
        return
      }

      if (status === 'CANCELLED' || status === 'EXPIRED') {
        // Não limpa o carrinho: o cliente pode tentar de novo (reservas serão refeitas).
        markOrderCancelledLocally()
      }
    },
  })
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelDialogOpen, setCancelDialogOpen] = useState(false)

  useEffect(() => {
    if (copyState === 'idle') return
    const timeoutId = window.setTimeout(() => setCopyState('idle'), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  const message = useMemo(
    () => (pendingOrder ? getWhatsAppMessage(pendingOrder) : ''),
    [pendingOrder]
  )

  if (!pendingOrder) {
    return null
  }

  async function handleCopy() {
    const ok = await copyToClipboard(message)
    setCopyState(ok ? 'copied' : 'failed')
  }

  async function handleCancel() {
    setCancelError(null)
    const result = await cancelPendingOrder()
    if (!result.ok) {
      setCancelError(result.message ?? 'Não foi possível cancelar o pedido.')
      return
    }
    setCancelDialogOpen(false)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
            Pedido criado com sucesso
          </h3>
          <p className="mt-2 max-w-[280px] text-sm leading-6 text-muted-foreground">
            Para finalizar, abra o WhatsApp e envie a mensagem para nossa equipe.
            Confirmamos pagamento e entrega por lá.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border/70 bg-[#fbf9f5] px-5 py-4">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span>Pedido</span>
            <span className="font-mono text-foreground/80">#{pendingOrder.orderId}</span>
          </div>
          <Separator className="my-3" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="text-right text-foreground">{pendingOrder.customer.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cidade</dt>
              <dd className="text-right text-foreground">{pendingOrder.customer.city}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span>Itens</span>
            <span>{pendingOrder.items.length} {pendingOrder.items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {pendingOrder.items.map((item) => (
              <li
                key={item.skuCode}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="line-clamp-1 text-foreground/85">
                  <span className="font-medium">{item.quantity}×</span>{' '}
                  {item.name}
                </span>
                <span className="shrink-0 font-medium text-foreground">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {cancelError && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/70 px-6 py-5">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-base font-semibold text-foreground">
            {formatPrice(pendingOrder.subtotal)}
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={() => openWhatsAppAndComplete()}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
        >
          <MessageCircle className="h-5 w-5" />
          Abrir WhatsApp
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleCopy}
          className="mt-2 w-full"
        >
          {copyState === 'copied' ? (
            <>
              <Check className="h-5 w-5" />
              Mensagem copiada
            </>
          ) : copyState === 'failed' ? (
            <>
              <AlertCircle className="h-5 w-5" />
              Não foi possível copiar
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Copiar mensagem
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => setCancelDialogOpen(true)}
          disabled={isCancellingOrder}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar pedido
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
          Seu pedido fica salvo aqui mesmo se você fechar a aba ou tiver
          problemas para abrir o WhatsApp.
        </p>
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelando agora, liberamos as reservas e seu carrinho será
              esvaziado. Você poderá montar um novo pedido depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingOrder}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancellingOrder}
              onClick={(event) => {
                event.preventDefault()
                void handleCancel()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isCancellingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Cancelar pedido'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
