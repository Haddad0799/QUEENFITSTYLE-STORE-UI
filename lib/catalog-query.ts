import type { CatalogQueryFilters, CatalogSearchParams } from './types'

interface SearchParamsReader {
  get(name: string): string | null
}

type SearchParamSource = CatalogSearchParams | URLSearchParams | SearchParamsReader
type CatalogFilterPatch = {
  [Key in keyof CatalogQueryFilters]?: CatalogQueryFilters[Key] | null
}

function getFirstValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value ?? undefined
}

function readSearchParam(source: SearchParamSource, key: string) {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined
  }

  if (typeof (source as SearchParamsReader).get === 'function') {
    return (source as SearchParamsReader).get(key) ?? undefined
  }

  return getFirstValue((source as CatalogSearchParams)[key as keyof CatalogSearchParams])
}

function normalizeString(value: string | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeNumber(value: string | undefined) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function parseCatalogSearchParams(source: SearchParamSource): CatalogQueryFilters {
  const category =
    normalizeString(readSearchParam(source, 'category')) ??
    normalizeString(readSearchParam(source, 'subcategory'))
  const label =
    normalizeString(readSearchParam(source, 'label')) ??
    normalizeString(readSearchParam(source, 'sizeName'))
  const pageSize = normalizeNumber(
    readSearchParam(source, 'size') ?? readSearchParam(source, 'pageSize')
  )

  return {
    category,
    color: normalizeString(readSearchParam(source, 'color')),
    label,
    minPrice: normalizeNumber(readSearchParam(source, 'minPrice')),
    maxPrice: normalizeNumber(readSearchParam(source, 'maxPrice')),
    search: normalizeString(readSearchParam(source, 'search')),
    isLaunch: readSearchParam(source, 'isLaunch') === 'true' ? true : undefined,
    page: normalizeNumber(readSearchParam(source, 'page')),
    pageSize,
  }
}

export function createCatalogSearchParams(filters: CatalogQueryFilters) {
  const params = new URLSearchParams()

  if (filters.category) params.set('category', filters.category)
  if (filters.color) params.set('color', filters.color)
  if (filters.label) params.set('label', filters.label)
  if (typeof filters.minPrice === 'number') params.set('minPrice', String(filters.minPrice))
  if (typeof filters.maxPrice === 'number') params.set('maxPrice', String(filters.maxPrice))
  if (filters.search) params.set('search', filters.search)
  if (filters.isLaunch) params.set('isLaunch', 'true')
  if (typeof filters.page === 'number') params.set('page', String(filters.page))
  if (typeof filters.pageSize === 'number') params.set('size', String(filters.pageSize))

  return params
}

export function buildCatalogQueryString(filters: CatalogQueryFilters) {
  return createCatalogSearchParams(filters).toString()
}

export function mergeCatalogQueryFilters(
  currentFilters: CatalogQueryFilters,
  patch: CatalogFilterPatch,
  options?: {
    resetPage?: boolean
  }
): CatalogQueryFilters {
  const nextFilters: CatalogQueryFilters = { ...currentFilters }
  const mutableFilters = nextFilters as Record<
    string,
    string | number | boolean | undefined
  >

  for (const [key, value] of Object.entries(patch) as [
    keyof CatalogQueryFilters,
    CatalogFilterPatch[keyof CatalogFilterPatch],
  ][]) {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'number' && Number.isNaN(value))
    ) {
      delete mutableFilters[key]
      continue
    }

    mutableFilters[key] = value as string | number | boolean
  }

  if (options?.resetPage) {
    nextFilters.page = 0
  }

  return nextFilters
}
