import type { ProductColor, ProductSku } from '@/lib/types'

interface ResolveInitialProductSelectionOptions {
  colors: ProductColor[]
  requestedColorName?: string
  defaultColorName?: string
  requestedLabel?: string
  defaultLabel?: string
}

export function getSelectionValue(value?: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue ? normalizedValue : undefined
}

function normalizeSelectionValue(value?: string | null) {
  const normalizedValue = getSelectionValue(value)
  return normalizedValue ? normalizedValue.toLocaleLowerCase('pt-BR') : undefined
}

export function findColorByName(colors: ProductColor[], colorName?: string | null) {
  const normalizedRequestedColor = normalizeSelectionValue(colorName)

  if (!normalizedRequestedColor) {
    return null
  }

  return (
    colors.find((color) => normalizeSelectionValue(color.colorName) === normalizedRequestedColor) ??
    null
  )
}

function getFirstColor(colors: ProductColor[]) {
  return colors[0] ?? null
}

export function getPreferredSku(color: ProductColor | null) {
  if (!color) {
    return null
  }

  return color.skus.find((sku) => sku.inStock) ?? null
}

export function findSkuByLabel(color: ProductColor | null, label?: string | null) {
  const normalizedRequestedLabel = normalizeSelectionValue(label)

  if (!color || !normalizedRequestedLabel) {
    return null
  }

  return (
    color.skus.find((sku) => normalizeSelectionValue(sku.sizeName) === normalizedRequestedLabel) ??
    null
  )
}

export function resolveInitialProductSelection({
  colors,
  requestedColorName,
  defaultColorName,
  requestedLabel,
  defaultLabel,
}: ResolveInitialProductSelectionOptions): {
  selectedColor: ProductColor | null
  selectedSku: ProductSku | null
} {
  const selectedColor =
    findColorByName(colors, requestedColorName) ??
    findColorByName(colors, defaultColorName) ??
    getFirstColor(colors)

  const selectedSku =
    findSkuByLabel(selectedColor, requestedLabel) ??
    findSkuByLabel(selectedColor, defaultLabel) ??
    getPreferredSku(selectedColor)

  return {
    selectedColor,
    selectedSku,
  }
}
