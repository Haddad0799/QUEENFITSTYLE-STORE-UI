// Tipos para a API de produtos

export interface Category {
  name: string
  normalizedName: string
}

export interface ProductListItem {
  name: string
  slug: string
  categoryName: string
  mainImageUrl: string
  minPrice: number
}

export interface ProductListResponse {
  content: ProductListItem[]
  totalPages: number
  number: number
}

export interface ProductSku {
  code: string
  sizeName: string
  sellingPrice: number
  availableStock: number
  inStock: boolean
}

export interface ProductColor {
  colorName: string
  colorHex: string
  imageUrls: string[]
  skus: ProductSku[]
}

export interface ProductDetail {
  name: string
  description: string
  slug: string
  categoryName: string
  mainImageUrl: string
  minPrice: number
  maxPrice: number
  colors: ProductColor[]
}

export interface SkuDetail {
  productName: string
  productSlug: string
  code: string
  colorName: string
  colorHex: string
  sizeName: string
  sellingPrice: number
  availableStock: number
  inStock: boolean
  imageUrls: string[]
}

export interface ProductFilters {
  category?: string
  color?: string
  size?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  page?: number
  pageSize?: number
}

// Tipos para o carrinho (preparação futura)
export interface CartItem {
  sku: SkuDetail
  quantity: number
}

export interface Cart {
  items: CartItem[]
  total: number
}
