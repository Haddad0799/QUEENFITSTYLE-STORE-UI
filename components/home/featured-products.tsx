import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/api'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'
import type { ProductListItem } from '@/lib/types'

export async function FeaturedProducts() {
  let products: ProductListItem[] = []

  try {
    const response = await getProducts({ pageSize: 8 })
    products = response.content
  } catch (error) {
    console.error('Erro ao carregar produtos em destaque:', error)
  }

  return (
    <section id="lancamentos" className="scroll-mt-24 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm uppercase tracking-widest text-muted-foreground">
              Lançamentos
            </p>
            <h2 className="text-3xl font-serif font-medium text-foreground md:text-4xl">
              Novidades da Coleção
            </h2>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/products" className="group">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </div>
    </section>
  )
}
