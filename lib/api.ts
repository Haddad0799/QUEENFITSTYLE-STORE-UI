import type {
  ProductListItem,
  ProductListResponse,
  ProductDetail,
  SkuDetail,
  CatalogQueryFilters,
  CategoryTree,
  AvailableCatalogFilters,
  CatalogColorFacet,
} from './types'
import { buildCatalogQueryString } from './catalog-query'
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

async function fetchCategoryResponse(): Promise<Response> {
  return fetch(CATEGORY_ENDPOINT, {
    next: { tags: ['catalog-categories'], revalidate: 300 }
  })
}

function buildRequestUrl(endpoint: string, filters: CatalogQueryFilters = {}) {
  const queryString = buildCatalogQueryString(filters)
  return `${endpoint}${queryString ? `?${queryString}` : ''}`
}

export async function getProducts(
  filters: CatalogQueryFilters = {}
): Promise<ProductListResponse> {
  const response = await fetch(buildRequestUrl(PRODUCTS_ENDPOINT, filters), {
    next: { tags: ['catalog-products'], revalidate: 300 }
  })

  if (!response.ok) {
    throw new Error('Falha ao carregar produtos')
  }

  return response.json()
}

export async function getAvailableFilters(
  filters: CatalogQueryFilters = {}
): Promise<AvailableCatalogFilters> {
  const response = await fetch(buildRequestUrl(FILTERS_ENDPOINT, filters), {
    next: { tags: ['catalog-filters'], revalidate: 300 }
  })

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
