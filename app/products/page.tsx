import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductFilters } from '@/components/product/product-filters'
import { ProductPagination } from '@/components/product/product-pagination'
import { ProductGridSkeleton } from '@/components/product/product-skeleton'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Explore nossa coleção completa de roupas fitness femininas. Leggings, tops, shorts e muito mais.',
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    minPrice?: string
    maxPrice?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
          Todos os Produtos
        </h1>
        <p className="text-muted-foreground">
          {params.search 
            ? `Resultados para "${params.search}"`
            : 'Descubra nossa coleção completa de roupas fitness'}
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-12 bg-muted rounded animate-pulse" />}>
        <ProductFilters />
      </Suspense>

      {/* Products */}
      <div className="mt-8">
        <Suspense fallback={<ProductGridSkeleton count={12} />}>
          <ProductList
            category={params.category}
            search={params.search}
            minPrice={params.minPrice}
            maxPrice={params.maxPrice}
            page={params.page}
          />
        </Suspense>
      </div>
    </div>
  )
}

async function ProductList({
  category,
  search,
  minPrice,
  maxPrice,
  page,
}: {
  category?: string
  search?: string
  minPrice?: string
  maxPrice?: string
  page?: string
}) {
  const currentPage = page ? parseInt(page, 10) : 0

  let response
  try {
    response = await getProducts({
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: currentPage,
      pageSize: 12,
    })
    console.log('Produtos recebidos do backend:', response)
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Não foi possível carregar os produtos.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-6">
        {response.content.length > 0
          ? `Mostrando ${response.content.length} produto${response.content.length > 1 ? 's' : ''}`
          : 'Nenhum produto encontrado'}
      </p>

      {/* Product Grid */}
      <ProductGrid products={response.content} />

      {/* Pagination */}
      {response.totalPages > 1 && (
        <div className="mt-12">
          <ProductPagination
            currentPage={response.number}
            totalPages={response.totalPages}
          />
        </div>
      )}
    </>
  )
}
