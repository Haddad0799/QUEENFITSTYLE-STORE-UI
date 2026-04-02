import type { ProductListResponse, ProductDetail, SkuDetail, ProductFilters, Category } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Função auxiliar para construir query params
function buildQueryParams(filters: ProductFilters): string {
  const params = new URLSearchParams()

  if (filters.category && filters.category !== 'all') params.append('category', filters.category)
  if (filters.color && filters.color !== 'all') params.append('color', filters.color)
  if (filters.size && filters.size !== 'all') params.append('size', filters.size)
  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== 0) params.append('minPrice', filters.minPrice.toString())
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== 0) params.append('maxPrice', filters.maxPrice.toString())
  if (filters.search && filters.search.trim() !== '') params.append('search', filters.search)
  if (filters.page !== undefined && filters.page !== null) params.append('page', filters.page.toString())
  if (filters.pageSize !== undefined && filters.pageSize !== null) params.append('size', filters.pageSize.toString())

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
  const url = `${API_BASE_URL}/store/categories`

  const response = await fetch(url, {
    next: { tags: ['catalog-categories'], revalidate: 300 }
  })

  if (!response.ok) {
    throw new Error('Falha ao carregar categorias')
  }

  return response.json()
}

// Formatar preço em BRL
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}
