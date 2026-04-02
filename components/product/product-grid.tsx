import type { ProductListItem } from '@/lib/types'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: ProductListItem[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          Nenhum produto encontrado
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Tente ajustar os filtros ou buscar por outro termo
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  )
}
