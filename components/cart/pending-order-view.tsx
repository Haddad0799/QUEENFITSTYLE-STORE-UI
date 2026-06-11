'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from 'lucide-react'
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

// Garante que cada pedido abra o WhatsApp automaticamente apenas uma vez, mesmo
// que a tela seja remontada (reabrir o drawer) ou a página recarregue na mesma
// aba. Sem isso, o WhatsApp reabriria toda vez que o cliente abrisse o carrinho.
const autoOpenedOrders = new Set<number>()

function hasAutoOpened(orderId: number) {
  if (autoOpenedOrders.has(orderId)) return true
  try {
    return sessionStorage.getItem(`qfs:wa-auto-opened:${orderId}`) === '1'
  } catch {
    return false
  }
}

function markAutoOpened(orderId: number) {
  autoOpenedOrders.add(orderId)
  try {
    sessionStorage.setItem(`qfs:wa-auto-opened:${orderId}`, '1')
  } catch {
    // sessionStorage indisponível — o Set em memória já evita repetição na sessão.
  }
}

export function PendingOrderView() {
  const { pendingOrder, dismissPendingOrder, cancelPendingOrder, isCancellingOrder } =
    useCart()
  const [isReminderOpen, setReminderOpen] = useState(false)
  const [isCancelOpen, setCancelOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const orderId = pendingOrder?.orderId ?? null
  const whatsappUrl = pendingOrder?.whatsappUrl ?? null

  function openWhatsApp() {
    if (!whatsappUrl) return
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  // Abre o WhatsApp automaticamente ao carregar a tela de confirmação, em nova
  // aba — assim o cliente não perde o resumo do pedido. Uma vez por pedido; se o
  // navegador bloquear o popup, o botão "Abrir WhatsApp" é o caminho manual.
  useEffect(() => {
    if (orderId == null || !whatsappUrl) return
    if (hasAutoOpened(orderId)) return
    markAutoOpened(orderId)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }, [orderId, whatsappUrl])

  if (!pendingOrder) {
    return null
  }

  async function handleCancel() {
    setCancelError(null)
    const result = await cancelPendingOrder()
    if (!result.ok) {
      setCancelError(result.message ?? 'Não foi possível cancelar o pedido.')
      return
    }
    // Sucesso: o pedido pendente é limpo no contexto e a tela desmonta.
    setCancelOpen(false)
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
          onClick={openWhatsApp}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90"
        >
          <MessageCircle className="h-5 w-5" />
          Abrir WhatsApp
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setReminderOpen(true)}
          className="mt-2 w-full"
        >
          Fechar
        </Button>

        <button
          type="button"
          onClick={() => {
            setCancelError(null)
            setCancelOpen(true)
          }}
          disabled={isCancellingOrder}
          className="mt-4 inline-flex w-full items-center justify-center text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          Cancelar pedido
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
          Seu pedido fica salvo aqui mesmo se você fechar a aba ou tiver
          problemas para abrir o WhatsApp.
        </p>
      </div>

      <AlertDialog open={isReminderOpen} onOpenChange={setReminderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seu pedido ainda não está confirmado</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisa enviar a mensagem pelo WhatsApp para nossa equipe
              confirmar o pagamento. Se não recebermos sua mensagem, o pedido será
              cancelado automaticamente em 24 horas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => dismissPendingOrder()}>
              Fechar mesmo assim
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={openWhatsApp}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              <MessageCircle className="h-5 w-5" />
              Abrir WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isCancelOpen}
        onOpenChange={(open) => {
          if (isCancellingOrder) return
          setCancelOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {cancelError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <AlertDialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void handleCancel()}
              disabled={isCancellingOrder}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isCancellingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Cancelar pedido'
              )}
            </Button>
            <AlertDialogAction disabled={isCancellingOrder}>
              Manter pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
