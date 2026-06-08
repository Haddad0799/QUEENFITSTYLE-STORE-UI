/**
 * ProblemDetail (RFC 9457) — formato de erro retornado pelo backend Java (Spring Boot).
 * O campo `type` identifica a categoria do erro e é a chave usada para resolver a
 * mensagem amigável em error-messages.ts.
 */
export interface ProblemDetail {
  title: string
  detail?: string
  status: number
  type: string
  timestamp?: string
  path?: string
  errors?: string[] // presente apenas em erros de validação
  conflicts?: unknown[] // presente apenas em erros de SKU duplicado
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'type' in value
  )
}
