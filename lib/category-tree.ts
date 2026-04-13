import type { CategoryTree } from './types'

export interface CategorySelection {
  node: CategoryTree
  path: CategoryTree[]
  value: string
  label: string
  includesDescendants: boolean
}

export function buildCategoryValue(path: CategoryTree[]): string {
  return path.map((category) => category.normalizedName).join('/')
}

export function buildCategoryLabel(path: CategoryTree[]): string {
  return path.map((category) => category.name).join(' / ')
}

export function collectCategoryAndDescendants(category: CategoryTree): CategoryTree[] {
  return [category, ...category.subcategories.flatMap(collectCategoryAndDescendants)]
}

export function findCategorySelection(
  categories: CategoryTree[],
  value: string
): CategorySelection | null {
  const segments = value.split('/').filter(Boolean)

  if (segments.length > 1) {
    let currentLevel = categories
    const path: CategoryTree[] = []

    for (const segment of segments) {
      const match = currentLevel.find((category) => category.normalizedName === segment)

      if (!match) {
        return null
      }

      path.push(match)
      currentLevel = match.subcategories
    }

    const node = path[path.length - 1]
    return {
      node,
      path,
      value: buildCategoryValue(path),
      label: buildCategoryLabel(path),
      includesDescendants: node.subcategories.length > 0,
    }
  }

  return findCategorySelectionByNormalizedName(categories, value)
}

function findCategorySelectionByNormalizedName(
  categories: CategoryTree[],
  normalizedName: string,
  ancestors: CategoryTree[] = []
): CategorySelection | null {
  for (const category of categories) {
    const path = [...ancestors, category]

    if (category.normalizedName === normalizedName) {
      return {
        node: category,
        path,
        value: buildCategoryValue(path),
        label: buildCategoryLabel(path),
        includesDescendants: category.subcategories.length > 0,
      }
    }

    const nestedMatch = findCategorySelectionByNormalizedName(
      category.subcategories,
      normalizedName,
      path
    )

    if (nestedMatch) {
      return nestedMatch
    }
  }

  return null
}
