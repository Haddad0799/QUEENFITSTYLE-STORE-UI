'use client'

import { MapPin } from 'lucide-react'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/cart/form-field'
import { DELIVERY_CITY, type CheckoutFormValues } from '@/components/cart/checkout-schema'
import { formatCepMask } from '@/src/utils/cep-mask'

interface DeliveryAddressFormProps {
  register: UseFormRegister<CheckoutFormValues>
  errors: FieldErrors<CheckoutFormValues>
  watch: UseFormWatch<CheckoutFormValues>
  setValue: UseFormSetValue<CheckoutFormValues>
  disabled?: boolean
}

export function DeliveryAddressForm({
  register,
  errors,
  watch,
  setValue,
  disabled,
}: DeliveryAddressFormProps) {
  const cepValue = watch('cep')

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Endereço de entrega
        </h3>
        <p className="flex items-center gap-1.5 text-sm leading-6 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          Realizamos entregas apenas em Pirenópolis - GO.
        </p>
      </div>

      <FormField id="checkout-cep" label="CEP" error={errors.cep?.message}>
        <Input
          id="checkout-cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="72980-000"
          value={formatCepMask(cepValue ?? '')}
          onChange={(event) => {
            setValue('cep', formatCepMask(event.target.value), {
              shouldValidate: false,
              shouldDirty: true,
            })
          }}
          onBlur={() => {
            // Valida o CEP ao perder o foco (não só no submit).
            setValue('cep', formatCepMask(cepValue ?? ''), {
              shouldValidate: true,
            })
          }}
          disabled={disabled}
          aria-invalid={Boolean(errors.cep)}
        />
      </FormField>

      <FormField id="checkout-city" label="Cidade">
        <Input
          id="checkout-city"
          value={DELIVERY_CITY}
          disabled
          readOnly
          aria-label="Cidade de entrega (fixa)"
        />
      </FormField>

      <FormField
        id="checkout-street"
        label="Rua"
        error={errors.street?.message}
      >
        <Input
          id="checkout-street"
          autoComplete="address-line1"
          placeholder="Ex.: Rua das Flores"
          disabled={disabled}
          aria-invalid={Boolean(errors.street)}
          {...register('street')}
        />
      </FormField>

      <FormField
        id="checkout-number"
        label="Número"
        error={errors.number?.message}
      >
        <Input
          id="checkout-number"
          inputMode="numeric"
          placeholder="Ex.: 123"
          disabled={disabled}
          aria-invalid={Boolean(errors.number)}
          {...register('number')}
        />
      </FormField>

      <FormField
        id="checkout-complement"
        label="Complemento"
        optional
        error={errors.complement?.message}
      >
        <Input
          id="checkout-complement"
          autoComplete="address-line2"
          placeholder="Ex.: Apto 1, fundos"
          disabled={disabled}
          aria-invalid={Boolean(errors.complement)}
          {...register('complement')}
        />
      </FormField>

      <FormField
        id="checkout-neighborhood"
        label="Bairro"
        error={errors.neighborhood?.message}
      >
        <Input
          id="checkout-neighborhood"
          autoComplete="address-level3"
          placeholder="Ex.: Centro"
          disabled={disabled}
          aria-invalid={Boolean(errors.neighborhood)}
          {...register('neighborhood')}
        />
      </FormField>
    </div>
  )
}
