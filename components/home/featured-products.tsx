import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProducts } from '@/lib/api'
import { ProductCard } from '@/components/product/product-card'
import { Button } from '@/components/ui/button'

export async function FeaturedProducts() {
  let products = []
  
  try {
    const response = await getProducts({ pageSize: 8 })
    products = response.content
  } catch (error) {
    console.error('Erro ao carregar produtos em destaque:', error)
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
              Destaques
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
              Produtos em Alta
            </h2>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/products" className="group">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              Nenhum produto disponível no momento.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
