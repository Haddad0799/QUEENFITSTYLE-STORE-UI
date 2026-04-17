import type { CategoryTree } from './types'

type CategoryTreeResponse = {
  id: number
  name: string
  slug?: string
  normalizedName?: string
  productCount?: number
  subcategories?: CategoryTreeResponse[] | null
}

export function normalizeCategoryTree(
  categories: CategoryTreeResponse[] | null | undefined
): CategoryTree[] {
  if (!Array.isArray(categories)) {
    return []
  }

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug ?? category.normalizedName ?? '',
    normalizedName: category.normalizedName ?? category.slug ?? '',
    productCount: category.productCount ?? 0,
    subcategories: normalizeCategoryTree(category.subcategories),
  }))
}
