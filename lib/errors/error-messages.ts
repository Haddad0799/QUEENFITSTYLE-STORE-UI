/**
 * Mapa de `type` (ProblemDetail) → mensagem amigável exibida ao usuário.
 *
 * Regra: ao adicionar um novo erro no backend, adicione a entrada correspondente
 * aqui. A chave deve bater EXATAMENTE com o `type` da exceção no Java.
 */
export const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  'https://example.com/probs/invalid-credentials': {
    title: 'Acesso negado',
    message: 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.',
  },
  'https://example.com/probs/email-already-in-use': {
    title: 'E-mail já cadastrado',
    message: 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.',
  },
  'https://example.com/probs/invalid-reservation': {
    title: 'Produto indisponível',
    message:
      'Um ou mais produtos do seu carrinho não estão mais disponíveis. Atualize o carrinho e tente novamente.',
  },
  'https://example.com/probs/reservation-already-bound': {
    title: 'Pedido duplicado',
    message: 'Este item já está vinculado a outro pedido. Atualize a página e tente novamente.',
  },
  'https://example.com/probs/sku-without-price': {
    title: 'Produto sem preço',
    message:
      'Um dos produtos selecionados não possui preço definido. Entre em contato com a loja.',
  },
  'https://example.com/probs/duplicate-sku-combination': {
    title: 'Combinação já existente',
    message: 'Já existe um produto com essa combinação de cor e tamanho.',
  },
  'https://example.com/probs/domain-exception': {
    title: 'Operação não permitida',
    message: 'Esta ação não pode ser realizada no momento. Tente novamente ou entre em contato.',
  },
  'https://example.com/probs/not-found': {
    title: 'Não encontrado',
    message: 'O recurso solicitado não foi encontrado.',
  },
  'https://example.com/probs/illegal-state': {
    title: 'Operação não permitida',
    message:
      'Esta ação não pode ser realizada porque o pedido está em um status que não permite essa operação.',
  },
  'https://example.com/probs/illegal-argument': {
    title: 'Dados inválidos',
    message: 'Os dados enviados são inválidos. Verifique e tente novamente.',
  },
  'https://example.com/probs/validation-error': {
    title: 'Campos inválidos',
    message: 'Verifique os campos destacados e corrija os erros antes de continuar.',
  },
  'https://example.com/probs/ai-integration': {
    title: 'Serviço temporariamente indisponível',
    message: 'O serviço de IA está temporariamente indisponível. Tente novamente em alguns instantes.',
  },
  'https://example.com/probs/ai-empty-response': {
    title: 'Serviço temporariamente indisponível',
    message: 'Não foi possível obter uma resposta da IA. Tente novamente.',
  },
  'https://example.com/probs/internal-server-error': {
    title: 'Erro inesperado',
    message: 'Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.',
  },
  // erros de pagamento (para quando o módulo payment for implementado)
  'https://example.com/probs/payment-not-found': {
    title: 'Pagamento não encontrado',
    message: 'Não foi possível localizar o pagamento. Verifique o pedido e tente novamente.',
  },
  'https://example.com/probs/payment-already-processed': {
    title: 'Pagamento já processado',
    message: 'Este pagamento já foi processado anteriormente.',
  },
}

// fallback para erros desconhecidos
export const DEFAULT_ERROR = {
  title: 'Erro inesperado',
  message: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
}
