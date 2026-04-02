import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductBySlug, getCategories, formatPrice } from '@/lib/api'
import { ProductDetailSkeleton } from '@/components/product/product-skeleton'
import { ProductDetailClient } from './product-detail-client'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const product = await getProductBySlug(slug)
    
    return {
      title: product.name,
      description: product.description || `${product.name} - ${product.categoryName}. Compre agora na QueenFitStyle.`,
      openGraph: {
        title: product.name,
        description: product.description || `${product.name} - ${product.categoryName}`,
        images: product.mainImageUrl ? [{ url: product.mainImageUrl }] : [],
        type: 'website',
      },
    }
  } catch {
    return {
      title: 'Produto não encontrado',
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail slug={slug} />
      </Suspense>
    </div>
  )
}

async function ProductDetail({ slug }: { slug: string }) {
  let product
  
  try {
    product = await getProductBySlug(slug)
  } catch {
    notFound()
  }

  // Look up normalizedName for breadcrumb link
  let categorySlug = product.categoryName
  try {
    const categories = await getCategories()
    const match = categories.find(c => c.name === product.categoryName)
    if (match) categorySlug = match.normalizedName
  } catch { /* fallback to categoryName */ }

  // Get price range display
  const priceDisplay = product.minPrice === product.maxPrice
    ? formatPrice(product.minPrice)
    : `${formatPrice(product.minPrice)} - ${formatPrice(product.maxPrice)}`

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <a href="/" className="hover:text-foreground transition-colors">
              Início
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/products" className="hover:text-foreground transition-colors">
              Produtos
            </a>
          </li>
          <li>/</li>
          <li>
            <a 
              href={`/products?category=${categorySlug}`} 
              className="hover:text-foreground transition-colors"
            >
              {product.categoryName}
            </a>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product Detail */}
      <ProductDetailClient product={product} priceDisplay={priceDisplay} />
    </>
  )
}
