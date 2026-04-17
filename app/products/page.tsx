import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getAvailableFilters, getCategories, getProducts } from '@/lib/api'
import { parseCatalogSearchParams } from '@/lib/catalog-query'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductFilters } from '@/components/product/product-filters'
import { ProductPagination } from '@/components/product/product-pagination'
import { CatalogEmptyState } from '@/components/product/catalog-empty-state'
import type {
  AvailableCatalogFilters,
  CatalogSearchParams,
  CategoryTree,
  ProductListResponse,
} from '@/lib/types'

export const metadata: Metadata = {
  title: 'Produtos',
  description:
    'Explore nossa coleção completa de roupas fitness femininas com URL como fonte da verdade para filtros e navegação.',
}

interface ProductsPageProps {
  searchParams: Promise<CatalogSearchParams>
}

const EMPTY_AVAILABLE_FILTERS: AvailableCatalogFilters = {
  colors: [],
  sizes: [],
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawSearchParams = await searchParams
  const filters = parseCatalogSearchParams(rawSearchParams)

  const [productsResult, categoriesResult, availableFiltersResult] = await Promise.allSettled([
    getProducts(filters),
    getCategories(),
    getAvailableFilters(filters),
  ])

  if (productsResult.status === 'rejected') {
    return (
      <CatalogPageShell
        title="Produtos"
        description="Não foi possível carregar o catálogo no momento."
      >
        <div className="rounded-[1.75rem] border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <p className="text-lg font-medium text-foreground">
            Não foi possível carregar os produtos.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente novamente em instantes para atualizar os filtros e a vitrine.
          </p>
        </div>
      </CatalogPageShell>
    )
  }

  const products = productsResult.value
  const categories =
    categoriesResult.status === 'fulfilled' ? categoriesResult.value : ([] as CategoryTree[])
  const availableFilters =
    availableFiltersResult.status === 'fulfilled'
      ? availableFiltersResult.value
      : EMPTY_AVAILABLE_FILTERS

  const hasActiveFilters = Boolean(
    filters.category ||
      filters.color ||
      filters.label ||
      filters.search ||
      typeof filters.minPrice === 'number' ||
      typeof filters.maxPrice === 'number'
  )

  return (
    <CatalogPageShell
      title={filters.category ? 'Coleção filtrada' : 'Todos os produtos'}
      description={
        filters.search
          ? `Resultados para "${filters.search}" com facetas dinâmicas e URL compartilhável.`
          : 'Encontre peças fitness femininas com o caimento, a cor e o estilo ideais para a sua rotina.'
      }
    >
      <div className="grid gap-8 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-14">
        <ProductFilters categories={categories} availableFilters={availableFilters} />

        <CatalogResults
          products={products}
          hasActiveFilters={hasActiveFilters}
          activeColor={filters.color}
          activeLabel={filters.label}
        />
      </div>
    </CatalogPageShell>
  )
}

function CatalogPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6 lg:py-8">
      <div className="mb-6 border-b border-border pb-4 lg:mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Produtos
        </p>
        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground lg:text-right">{description}</p>
        </div>
      </div>

      {children}
    </div>
  )
}

function CatalogResults({
  products,
  hasActiveFilters,
  activeColor,
  activeLabel,
}: {
  products: ProductListResponse
  hasActiveFilters: boolean
  activeColor?: string
  activeLabel?: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          {products.content.length > 0
            ? `Mostrando ${products.content.length} produto${products.content.length > 1 ? 's' : ''}`
            : 'Nenhum produto encontrado'}
        </p>
      </div>

      <ProductGrid
        products={products.content}
        activeColor={activeColor}
        activeLabel={activeLabel}
        emptyState={<CatalogEmptyState hasActiveFilters={hasActiveFilters} />}
      />

      {products.totalPages > 1 ? (
        <div className="mt-12">
          <ProductPagination currentPage={products.number} totalPages={products.totalPages} />
        </div>
      ) : null}
    </div>
  )
}
