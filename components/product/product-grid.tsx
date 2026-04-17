import type { ReactNode } from 'react'
import type { ProductListItem } from '@/lib/types'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: ProductListItem[]
  emptyState?: ReactNode
}

export function ProductGrid({ products, emptyState }: ProductGridProps) {
  if (products.length === 0) {
    return emptyState ?? (
      <div className="flex min-h-[320px] flex-col items-center justify-center border border-dashed border-border bg-muted/20 py-16 text-center">
        <p className="text-lg text-muted-foreground">
          Nenhum produto encontrado
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tente ajustar os filtros ou buscar por outro termo
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:gap-8 2xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  )
}
