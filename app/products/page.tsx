import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getCategoryTree, getProducts, getProductsByCategories } from '@/lib/api'
import { collectCategoryAndDescendants, findCategorySelection } from '@/lib/category-tree'
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
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6 border-b border-border pb-4 lg:mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Produtos
        </p>
        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {params.category ? 'Coleção filtrada' : 'Todos os produtos'}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-right">
            {params.search
              ? `Resultados para "${params.search}"`
              : 'Explore a vitrine completa com navegação por categoria e filtros laterais.'}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <Suspense fallback={<div className="h-64 border-r border-border" />}>
          <ProductFilters />
        </Suspense>

        <div className="min-w-0">
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
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
    const filters = {
      category,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      page: currentPage,
      pageSize: 12,
    }

    if (category) {
      const categories = await getCategoryTree()
      const selection = findCategorySelection(categories, category)

      if (selection?.includesDescendants) {
        const categoryValues = collectCategoryAndDescendants(selection.node).map(
          (item) => item.normalizedName
        )

        response = await getProductsByCategories(categoryValues, filters)
      } else {
        response = await getProducts({
          ...filters,
          category: selection?.node.normalizedName ?? category,
        })
      }
    } else {
      response = await getProducts(filters)
    }
  } catch {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">Não foi possível carregar os produtos.</p>
        <p className="mt-1 text-sm text-muted-foreground">Por favor, tente novamente mais tarde.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {response.content.length > 0
            ? `Mostrando ${response.content.length} produto${response.content.length > 1 ? 's' : ''}`
            : 'Nenhum produto encontrado'}
        </p>
      </div>

      <ProductGrid products={response.content} />

      {response.totalPages > 1 && (
        <div className="mt-12">
          <ProductPagination currentPage={response.number} totalPages={response.totalPages} />
        </div>
      )}
    </>
  )
}
