const MAX_CEP_DIGITS = 8

// Faixa de CEPs de Pirenópolis - GO (única região atendida).
export const PIRENOPOLIS_CEP_RANGE = {
  start: '72980000',
  end: '72989999',
} as const

export function stripCepDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, MAX_CEP_DIGITS)
}

export function formatCepMask(value: string) {
  const digits = stripCepDigits(value)

  if (digits.length <= 5) return digits

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isCompleteCep(value: string) {
  return stripCepDigits(value).length === MAX_CEP_DIGITS
}

export function isPirenopolisCep(value: string) {
  const digits = stripCepDigits(value)

  return (
    digits.length === MAX_CEP_DIGITS &&
    digits >= PIRENOPOLIS_CEP_RANGE.start &&
    digits <= PIRENOPOLIS_CEP_RANGE.end
  )
}
