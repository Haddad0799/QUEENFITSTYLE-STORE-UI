import { isProblemDetail } from './problem-detail'
import { ERROR_MESSAGES, DEFAULT_ERROR } from './error-messages'

const VALIDATION_ERROR_TYPE = 'https://example.com/probs/validation-error'

export interface ResolvedError {
  title: string
  message: string
  validationErrors?: string[] // só presente em erros de validação
}

export function resolveApiError(error: unknown): ResolvedError {
  if (!isProblemDetail(error)) {
    return DEFAULT_ERROR
  }

  const mapped = ERROR_MESSAGES[error.type]

  // erros de validação: além da mensagem, lista os campos com problema
  if (error.type === VALIDATION_ERROR_TYPE && error.errors?.length) {
    return {
      title: mapped?.title ?? 'Campos inválidos',
      message: mapped?.message ?? DEFAULT_ERROR.message,
      validationErrors: error.errors,
    }
  }

  return mapped ?? DEFAULT_ERROR
}
