'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatPrice } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useCart } from '@/src/hooks/useCart'
import {
  formatPhoneMask,
  isValidBrazilianPhone,
  stripPhoneDigits,
} from '@/src/utils/phone-mask'

const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo.')
    .max(80, 'Nome muito longo.'),
  phone: z
    .string()
    .trim()
    .refine(isValidBrazilianPhone, 'Informe um WhatsApp válido com DDD.'),
  city: z
    .string()
    .trim()
    .min(2, 'Informe sua cidade ou bairro.')
    .max(80, 'Cidade muito longa.'),
  notes: z
    .string()
    .trim()
    .max(500, 'Observação muito longa.')
    .optional()
    .or(z.literal('')),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
  const { items, subtotal, totalItems, backToCart, submitOrder, isSubmittingOrder } =
    useCart()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onBlur',
    defaultValues: { name: '', phone: '', city: '', notes: '' },
  })

  const phoneValue = watch('phone')

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null)

    const result = await submitOrder({
      customer: {
        name: values.name,
        phone: stripPhoneDigits(values.phone),
        city: values.city,
      },
      notes: values.notes?.trim() ? values.notes.trim() : undefined,
    })

    if (!result.ok) {
      setServerError(result.message)
      return
    }

    // The CartProvider transitions to the 'pending-order' step on success.
    // Do NOT redirect from here — keeping the user on the recovery screen is
    // the whole point of the resilient flow.
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-1 flex-col overflow-hidden"
      noValidate
    >
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <button
          type="button"
          onClick={backToCart}
          disabled={isSubmittingOrder}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao carrinho
        </button>

        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Seus dados
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Confirme o pedido pelo WhatsApp. Não cobramos nada por aqui —
            combinamos pagamento e entrega no chat.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <FormField
            id="checkout-name"
            label="Nome completo"
            error={errors.name?.message}
          >
            <Input
              id="checkout-name"
              autoComplete="name"
              placeholder="Como podemos te chamar?"
              disabled={isSubmittingOrder}
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField
            id="checkout-phone"
            label="WhatsApp"
            error={errors.phone?.message}
          >
            <Input
              id="checkout-phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              value={formatPhoneMask(phoneValue ?? '')}
              onChange={(event) => {
                setValue('phone', formatPhoneMask(event.target.value), {
                  shouldValidate: false,
                  shouldDirty: true,
                })
              }}
              onBlur={() => {
                setValue('phone', formatPhoneMask(phoneValue ?? ''), {
                  shouldValidate: true,
                })
              }}
              disabled={isSubmittingOrder}
              aria-invalid={Boolean(errors.phone)}
            />
          </FormField>

          <FormField
            id="checkout-city"
            label="Cidade / Bairro"
            error={errors.city?.message}
          >
            <Input
              id="checkout-city"
              autoComplete="address-level2"
              placeholder="Ex.: São Paulo - Vila Mariana"
              disabled={isSubmittingOrder}
              aria-invalid={Boolean(errors.city)}
              {...register('city')}
            />
          </FormField>

          <FormField
            id="checkout-notes"
            label="Observações"
            optional
            error={errors.notes?.message}
          >
            <Textarea
              id="checkout-notes"
              placeholder="Tamanho preferido, cor de preferência, dúvidas..."
              rows={3}
              disabled={isSubmittingOrder}
              aria-invalid={Boolean(errors.notes)}
              {...register('notes')}
            />
          </FormField>
        </div>

        <div className="mt-8 rounded-2xl border border-border/70 bg-[#fbf9f5] p-4">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <span>Resumo</span>
            <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
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

        {serverError && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border/70 px-6 py-5">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="text-base font-semibold text-foreground">
            {formatPrice(subtotal)}
          </span>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmittingOrder || items.length === 0}
          className="w-full"
        >
          {isSubmittingOrder ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando pedido...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Confirmar pedido
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">
          Ao confirmar, você será redirecionada para o WhatsApp para finalizar
          a compra com a nossa equipe.
        </p>
      </div>
    </form>
  )
}

function FormField({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="text-xs uppercase tracking-[0.12em] text-foreground/80">
          {label}
        </Label>
        {optional && (
          <span className="text-[11px] text-muted-foreground">opcional</span>
        )}
      </div>
      {children}
      {error && (
        <p className={cn('text-xs leading-5 text-destructive')}>{error}</p>
      )}
    </div>
  )
}
