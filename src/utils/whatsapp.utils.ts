import { formatPrice } from '@/lib/api'
import type { PendingOrder } from '@/src/types/order.types'

export function extractWhatsAppMessage(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.searchParams.get('text')
  } catch {
    return null
  }
}

export function buildWhatsAppFallbackMessage(order: PendingOrder): string {
  const items = order.items
    .map((item) => `• ${item.quantity}× ${item.name}`)
    .join('\n')

  const { cep, street, number, complement, neighborhood } = order.deliveryAddress
  const streetLine = complement
    ? `${street}, ${number} - ${complement}`
    : `${street}, ${number}`

  const lines = [
    `Olá! Acabei de fazer o pedido #${order.orderId} pelo site.`,
    '',
    items,
    '',
    `Total: ${formatPrice(order.subtotal)}`,
    '',
    `Nome: ${order.customer.name}`,
    `Cidade: ${order.customer.city}`,
    `Endereço: ${streetLine}`,
    `Bairro: ${neighborhood}`,
    `CEP: ${cep}`,
  ]

  if (order.notes) {
    lines.push('', `Observações: ${order.notes}`)
  }

  return lines.join('\n')
}

export function getWhatsAppMessage(order: PendingOrder): string {
  return extractWhatsAppMessage(order.whatsappUrl) ?? buildWhatsAppFallbackMessage(order)
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fallthrough to legacy fallback below
    }
  }

  if (typeof document === 'undefined') return false

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
