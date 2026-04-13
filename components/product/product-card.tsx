import Link from 'next/link'
import Image from 'next/image'
import type { ProductListItem } from '@/lib/types'
import { formatPrice } from '@/lib/api'

interface ProductCardProps {
  product: ProductListItem
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#f3f2ef]">
        <Image
          src={product.mainImageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/3" />
      </div>
      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {product.categoryName}
        </p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground transition-opacity group-hover:opacity-70">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(product.minPrice)}
        </p>
      </div>
    </Link>
  )
}
