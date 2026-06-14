import 'server-only'

import { getStoreSettings } from '@/src/lib/erpClient'

// Fonte central dos links de WhatsApp da loja. O número vem de GET /store/settings
// (configurável pela dona), de forma centralizada e cacheada — nenhum componente
// busca o número por conta própria. Server-only: não importar em Client Components.

// Mensagens pré-prontas por contexto de atendimento.
export const WHATSAPP_MESSAGES = {
  contact: 'Olá! Tenho uma dúvida e gostaria de falar com vocês.',
  return: 'Olá! Gostaria de solicitar uma troca ou devolução. Pode me ajudar?',
  tracking: 'Olá! Gostaria de rastrear meu pedido. Pode me ajudar?',
} as const

export type WhatsAppTopic = keyof typeof WHATSAPP_MESSAGES

function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/**
 * Número de WhatsApp da loja (apenas dígitos), vindo de GET /store/settings.
 * Retorna '' quando não há número configurado ou a busca falha, para os
 * consumidores degradarem com segurança sem quebrar a renderização.
 */
export async function getStoreWhatsAppPhone(): Promise<string> {
  try {
    const { whatsappPhone } = await getStoreSettings()
    return whatsappPhone
  } catch {
    return ''
  }
}

/**
 * Links de WhatsApp da loja por contexto. Cada valor é `null` quando não há
 * número configurado — o consumidor decide como degradar (ex.: ocultar o link).
 */
export async function getStoreWhatsAppLinks(): Promise<
  Record<WhatsAppTopic, string | null>
> {
  const phone = await getStoreWhatsAppPhone()

  const build = (topic: WhatsAppTopic) =>
    phone ? buildWhatsAppUrl(phone, WHATSAPP_MESSAGES[topic]) : null

  return {
    contact: build('contact'),
    return: build('return'),
    tracking: build('tracking'),
  }
}
