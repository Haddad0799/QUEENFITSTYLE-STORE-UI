// Tipos para a API de produtos

export interface Category {
  id?: number
  name: string
  slug: string
  normalizedName?: string
  productCount?: number
}

export interface CategoryTree {
  id: number
  name: string
  slug: string
  normalizedName?: string
  productCount?: number
  subcategories: CategoryTree[]
}

export interface ProductListItem {
  name: string
  slug: string
  categoryName: string
  mainImageUrl: string
  minPrice: number
  isLaunch?: boolean
  launchLabel?: string
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
  width: number
  height: number
  length: number
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
  isLaunch?: boolean
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
