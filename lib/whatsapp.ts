const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '';

function buildUrl(message: string): string {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

export const whatsapp = {
  tracking: () =>
    buildUrl('Olá! Gostaria de rastrear meu pedido. Pode me ajudar?'),
  return: () =>
    buildUrl('Olá! Gostaria de solicitar uma troca ou devolução. Pode me ajudar?'),
  contact: () =>
    buildUrl('Olá! Tenho uma dúvida e gostaria de falar com vocês.'),
};
