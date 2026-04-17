import type {
  ProductListItem,
  ProductListResponse,
  ProductDetail,
  SkuDetail,
  ProductFilters,
  Category,
  CategoryTree,
} from './types'
import { normalizeCategoryTree } from './category-tree-normalizer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const CATEGORY_ENDPOINT = `${API_BASE_URL}/store/catalog/categories`

async function fetchCategoryResponse(): Promise<Response> {
  return fetch(CATEGORY_ENDPOINT, {
    next: { tags: ['catalog-categories'], revalidate: 300 }
  })
}

// Função auxiliar para construir query params
function buildQueryParams(filters: ProductFilters): string {
  const params = new URLSearchParams()
  const hasSizeFilter = Boolean(filters.size && filters.size !== 'all')

  if (filters.category && filters.category !== 'all') params.append('category', filters.category)
  if (filters.color && filters.color !== 'all') params.append('color', filters.color)
  if (filters.size && filters.size !== 'all') params.append('size', filters.size)
  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== 0) params.append('minPrice', filters.minPrice.toString())
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== 0) params.append('maxPrice', filters.maxPrice.toString())
  if (filters.search && filters.search.trim() !== '') params.append('search', filters.search)
  if (filters.isLaunch) params.append('isLaunch', 'true')
  if (filters.page !== undefined && filters.page !== null) params.append('page', filters.page.toString())
  if (!hasSizeFilter && filters.pageSize !== undefined && filters.pageSize !== null) params.append('size', filters.pageSize.toString())

  return params.toString()
}

// Listar produtos com filtros
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const queryString = buildQueryParams(filters)
  const url = `${API_BASE_URL}/store/products${queryString ? `?${queryString}` : ''}`
  console.log('URL de requisição:', url) // Log da URL para depuração

  const response = await fetch(url, {
    next: { tags: ['catalog-products'], revalidate: 300 }
  })
  
  if (!response.ok) {
    throw new Error('Falha ao carregar produtos')
  }
  
  return response.json()
}

export async function getProductsByCategories(
  categoryValues: string[],
  filters: ProductFilters = {}
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

// Listar categorias
export async function getCategories(): Promise<Category[]> {
  const response = await fetchCategoryResponse()

  if (!response.ok) {
    throw new Error('Falha ao carregar categorias')
  }

  return response.json()
}

// Listar árvore de categorias
export async function getCategoryTree(): Promise<CategoryTree[]> {
  const response = await fetchCategoryResponse()

  if (!response.ok) {
    throw new Error('Falha ao carregar árvore de categorias')
  }

  const data = await response.json()
  return normalizeCategoryTree(data)
}

// Formatar preço em BRL
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}
