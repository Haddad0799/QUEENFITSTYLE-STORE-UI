// Variável apenas de servidor (sem prefixo NEXT_PUBLIC_): este módulo só é
// consumido pelo footer, um Server Component, então o número é injetado no HTML
// em runtime sem ir para o bundle do browser. Não importar em Client Components.
//
// Mantém apenas dígitos (DDI 55 + DDD + número), removendo +, espaços,
// parênteses e hífens que possam vir da variável. Sem isso, um número ausente
// ou formatado gera https://wa.me/?text=... e o WhatsApp abre a tela de seleção
// de contato em vez da conversa com a loja.
const PHONE = (process.env.WHATSAPP_SELLER_PHONE ?? '').replace(/\D/g, '');

function buildUrl(message: string): string {
  if (!PHONE && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[whatsapp] WHATSAPP_SELLER_PHONE não definido: os links abrirão sem destinatário.'
    );
  }

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
