const MAX_PHONE_DIGITS = 11

export function stripPhoneDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, MAX_PHONE_DIGITS)
}

export function formatPhoneMask(value: string) {
  const digits = stripPhoneDigits(value)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function isValidBrazilianPhone(value: string) {
  const digits = stripPhoneDigits(value)
  return digits.length === 10 || digits.length === 11
}
