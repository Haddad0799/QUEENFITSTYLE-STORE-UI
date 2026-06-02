import type {
  Category,
  ProductListItem,
  ProductListResponse,
  ProductDetail,
  SkuDetail,
  CatalogQueryFilters,
  CategoryTree,
  AvailableCatalogFilters,
  CatalogColorFacet,
  ProductListSelection,
} from './types'
import { buildCatalogQueryString, hasActiveCatalogFilters } from './catalog-query'
import { normalizeCategoryTree } from './category-tree-normalizer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/store/products`
const CATEGORY_ENDPOINT = `${API_BASE_URL}/store/catalog/categories`
const FILTERS_ENDPOINT = `${API_BASE_URL}/store/catalog/filters`

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function normalizeStringFacet(value: unknown) {
  if (!isStringArray(value)) {
    return []
  }

  return [...new Set(value.map((item: string) => item.trim()).filter((item: string) => item.length > 0))]
}

function normalizeColorFacets(value: unknown): CatalogColorFacet[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalizedColors = value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }

    const rawName = 'name' in item ? item.name : undefined
    const rawHex = 'hex' in item ? item.hex : undefined

    if (typeof rawName !== 'string' || typeof rawHex !== 'string') {
      return []
    }

    const name = rawName.trim()
    const hex = rawHex.trim()

    if (!name || !hex) {
      return []
    }

    return [{ name, hex }]
  })

  return normalizedColors.filter(
    (color, index, array) => array.findIndex((item) => item.name === color.name) === index
  )
}

function normalizeString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : undefined
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return undefined
  }

  const parsedValue = Number(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function normalizeCategory(value: unknown): Category | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const name = normalizeString('name' in value ? value.name : undefined)
  const slug = normalizeString('slug' in value ? value.slug : undefined)

  if (!name || !slug) {
    return undefined
  }

  const id = normalizeNumber('id' in value ? value.id : undefined)
  const normalizedName = normalizeString(
    'normalizedName' in value ? value.normalizedName : undefined
  )
  const productCount = normalizeNumber('productCount' in value ? value.productCount : undefined)

  return {
    ...(typeof id === 'number' ? { id } : {}),
    name,
    slug,
    ...(normalizedName ? { normalizedName } : {}),
    ...(typeof productCount === 'number' ? { productCount } : {}),
  }
}

function normalizeProductListSelection(value: unknown): ProductListSelection | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const skuCode = normalizeString('skuCode' in value ? value.skuCode : undefined)
  const label = normalizeString('label' in value ? value.label : undefined)
  const price = normalizeNumber('price' in value ? value.price : undefined)

  if (!skuCode || !label) {
    return undefined
  }

  return {
    skuCode,
    label,
    ...(typeof price === 'number' ? { price } : {}),
  }
}

function normalizeProductListItem(value: unknown): ProductListItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const name = normalizeString('name' in value ? value.name : undefined)
  const slug = normalizeString('slug' in value ? value.slug : undefined)
  const category = normalizeCategory('category' in value ? value.category : undefined)

  if (!name || !slug || !category) {
    return null
  }

  const selection = normalizeProductListSelection(
    'selection' in value ? value.selection : 'defaultSelection' in value ? value.defaultSelection : undefined
  )
  const displayImageUrl = normalizeString(
    'displayImageUrl' in value
      ? value.displayImageUrl
      : 'mainImageUrl' in value
        ? value.mainImageUrl
        : undefined
  )
  const displayPrice =
    normalizeNumber('displayPrice' in value ? value.displayPrice : undefined) ??
    selection?.price
  const subcategory = normalizeCategory('subcategory' in value ? value.subcategory : undefined)
  const isLaunch = 'isLaunch' in value && typeof value.isLaunch === 'boolean' ? value.isLaunch : undefined
  const launchLabel = normalizeString('launchLabel' in value ? value.launchLabel : undefined)

  return {
    name,
    slug,
    category,
    ...(subcategory ? { subcategory } : {}),
    ...(displayImageUrl ? { displayImageUrl } : {}),
    ...(typeof displayPrice === 'number' ? { displayPrice } : {}),
    ...(selection ? { selection } : {}),
    ...(typeof isLaunch === 'boolean' ? { isLaunch } : {}),
    ...(launchLabel ? { launchLabel } : {}),
  }
}

function normalizeProductListResponse(value: unknown): ProductListResponse {
  if (!value || typeof value !== 'object') {
    return {
      content: [],
      totalPages: 0,
      number: 0,
    }
  }

  const rawContent = 'content' in value ? value.content : undefined
  const content = Array.isArray(rawContent)
    ? rawContent.flatMap((item) => {
        const normalizedItem = normalizeProductListItem(item)
        return normalizedItem ? [normalizedItem] : []
      })
    : []

  const totalPages = normalizeNumber('totalPages' in value ? value.totalPages : undefined) ?? 0
  const totalElements = normalizeNumber(
    'totalElements' in value ? value.totalElements : undefined
  )
  const size = normalizeNumber('size' in value ? value.size : undefined)
  const number = normalizeNumber('number' in value ? value.number : undefined) ?? 0
  const numberOfElements = normalizeNumber(
    'numberOfElements' in value ? value.numberOfElements : undefined
  )

  return {
    content,
    totalPages,
    number,
    ...(typeof totalElements === 'number' ? { totalElements } : {}),
    ...(typeof size === 'number' ? { size } : {}),
    ...(typeof numberOfElements === 'number' ? { numberOfElements } : {}),
  }
}

async function fetchCategoryResponse(): Promise<Response> {
  return fetch(CATEGORY_ENDPOINT, {
    next: { tags: ['catalog-categories'], revalidate: 300 }
  })
}

function buildRequestUrl(endpoint: string, filters: CatalogQueryFilters = {}) {
  const queryString = buildCatalogQueryString(filters)
  return `${endpoint}${queryString ? `?${queryString}` : ''}`
}

function buildCatalogFetchOptions(tag: string, filters: CatalogQueryFilters = {}) {
  if (hasActiveCatalogFilters(filters)) {
    return {
      cache: 'no-store' as const,
    }
  }

  return {
    next: { tags: [tag], revalidate: 300 },
  }
}

export async function getProducts(
  filters: CatalogQueryFilters = {}
): Promise<ProductListResponse> {
  const response = await fetch(
    buildRequestUrl(PRODUCTS_ENDPOINT, filters),
    buildCatalogFetchOptions('catalog-products', filters)
  )

  if (!response.ok) {
    throw new Error('Falha ao carregar produtos')
  }

  const data = await response.json()
  return normalizeProductListResponse(data)
}

export async function getAvailableFilters(
  filters: CatalogQueryFilters = {}
): Promise<AvailableCatalogFilters> {
  const response = await fetch(
    buildRequestUrl(FILTERS_ENDPOINT, filters),
    buildCatalogFetchOptions('catalog-filters', filters)
  )

  if (!response.ok) {
    throw new Error('Falha ao carregar filtros disponíveis')
  }

  const data: { colors?: unknown; sizes?: unknown } = await response.json()

  return {
    colors: normalizeColorFacets(data.colors),
    sizes: normalizeStringFacet(data.sizes),
  }
}

export async function getProductsByCategories(
  categoryValues: string[],
  filters: CatalogQueryFilters = {}
): Promise<ProductListResponse> {
  const uniqueCategories = [...new Set(categoryValues.filter(Boolean))]
  const mergedProducts = new Map<string, ProductListItem>()
  const requestedPage = filters.page ?? 0
  const requestedPageSize = filters.pageSize ?? 12

  for (const category of uniqueCategories) {
    let page = 0
    let totalPages = 1

    do {
      const response = await getProducts({
        ...filters,
        category,
        page,
        pageSize: 100,
      })

      for (const product of response.content) {
        mergedProducts.set(product.slug, product)
      }

      totalPages = response.totalPages
      page += 1
    } while (page < totalPages)
  }

  const content = Array.from(mergedProducts.values())
  const totalPages = content.length === 0 ? 0 : Math.ceil(content.length / requestedPageSize)
  const start = requestedPage * requestedPageSize

  return {
    content: content.slice(start, start + requestedPageSize),
    totalPages,
    number: requestedPage,
  }
}

// Obter detalhe de um produto
export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const url = `${API_BASE_URL}/store/products/${slug}`
  
  const response = await fetch(url, {
    next: { tags: [`catalog-product-${slug}`], revalidate: 300 }
  })
  
  if (!response.ok) {
    throw new Error('Produto não encontrado')
  }
  
  return response.json()
}

// Obter detalhe de um SKU específico
export async function getSkuDetail(slug: string, skuCode: string): Promise<SkuDetail> {
  const url = `${API_BASE_URL}/store/products/${slug}/skus/${skuCode}`
  
  const response = await fetch(url, {
    next: { tags: [`catalog-product-${slug}`], revalidate: 300 }
  })
  
  if (!response.ok) {
    throw new Error('SKU não encontrado')
  }
  
  return response.json()
}

export async function getCategories(): Promise<CategoryTree[]> {
  const response = await fetchCategoryResponse()

  if (!response.ok) {
    throw new Error('Falha ao carregar categorias')
  }

  const data = await response.json()
  return normalizeCategoryTree(data)
}

export async function getCategoryTree(): Promise<CategoryTree[]> {
  return getCategories()
}

// Formatar preço em BRL
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}
