import { z } from 'zod'
import { isValidBrazilianPhone } from '@/src/utils/phone-mask'
import { isCompleteCep, isPirenopolisCep } from '@/src/utils/cep-mask'

// Cidade/UF de entrega são fixas (backend define o resto). Usada para preencher
// customer.city e exibir o campo desabilitado no formulário.
export const DELIVERY_CITY = 'Pirenópolis - GO'

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo.')
    .max(80, 'Nome muito longo.'),
  phone: z
    .string()
    .trim()
    .refine(isValidBrazilianPhone, 'Informe um WhatsApp válido com DDD.'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu email.')
    .email('Informe um email válido.'),
  cep: z
    .string()
    .trim()
    .refine(isCompleteCep, 'Informe um CEP válido (00000-000).')
    .refine(
      isPirenopolisCep,
      'No momento entregamos apenas em Pirenópolis - GO.',
    ),
  street: z
    .string()
    .trim()
    .min(2, 'Informe a rua.')
    .max(120, 'Endereço muito longo.'),
  number: z
    .string()
    .trim()
    .min(1, 'Informe o número.')
    .max(20, 'Número inválido.'),
  complement: z
    .string()
    .trim()
    .max(60, 'Complemento muito longo.')
    .optional()
    .or(z.literal('')),
  neighborhood: z
    .string()
    .trim()
    .min(2, 'Informe o bairro.')
    .max(80, 'Bairro muito longo.'),
  notes: z
    .string()
    .trim()
    .max(500, 'Observação muito longa.')
    .optional()
    .or(z.literal('')),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
