import { Suspense } from 'react'
import { HeroBanner } from '@/components/home/hero-banner'
import { FeaturedProducts } from '@/components/home/featured-products'
import { CategoryGrid } from '@/components/home/category-grid'
import { Newsletter } from '@/components/home/newsletter'
import { ProductGridSkeleton } from '@/components/product/product-skeleton'

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <CategoryGrid />
      <Newsletter />
    </>
  )
}

function ProductsLoadingSkeleton() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </section>
  )
}
