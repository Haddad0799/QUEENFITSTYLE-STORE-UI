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

export interface CatalogColorFacet {
  name: string
  hex: string
}

export interface ProductMainColor {
  name: string
  hex?: string
}

export interface ProductDefaultSelection {
  skuCode: string
  label: string
  price: number
}

export interface ProductListSelection {
  skuCode: string
  label: string
  price?: number
}

export interface AvailableCatalogFilters {
  colors: CatalogColorFacet[]
  sizes: string[]
}

export interface ProductListItem {
  name: string
  slug: string
  category: Category
  subcategory?: Category
  displayImageUrl?: string
  displayPrice?: number
  selection?: ProductListSelection
  isLaunch?: boolean
  launchLabel?: string
}

export interface ProductListResponse {
  content: ProductListItem[]
  totalPages: number
  totalElements?: number
  size?: number
  number: number
  numberOfElements?: number
}

export interface ProductSku {
  id?: number
  skuId?: number
  productId?: number
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
  id?: number
  productId?: number
  name: string
  description: string
  slug: string
  categoryName: string
  mainImageUrl: string
  displayImageUrl?: string
  mainColor?: ProductMainColor
  defaultSelection?: ProductDefaultSelection
  displayPrice?: number
  minPrice: number
  maxPrice: number
  colors: ProductColor[]
}

export interface SkuDetail {
  id?: number
  skuId?: number
  productId?: number
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

export interface CatalogQueryFilters {
  category?: string
  color?: string
  label?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  isLaunch?: boolean
  page?: number
  pageSize?: number
}

export type ProductFilters = CatalogQueryFilters

export interface CatalogSearchParams {
  category?: string | string[]
  subcategory?: string | string[]
  color?: string | string[]
  label?: string | string[]
  sizeName?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  search?: string | string[]
  isLaunch?: string | string[]
  page?: string | string[]
  size?: string | string[]
  pageSize?: string | string[]
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
