import Link from 'next/link'
import Image from 'next/image'
import type { ProductListItem } from '@/lib/types'
import { formatPrice } from '@/lib/api'
import { getSelectionValue } from '@/lib/product-selection'
import { isFiniteNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ProductCardProps {
  product: ProductListItem
  activeColor?: string
  activeLabel?: string
}

function buildProductHref(
  slug: string,
  selection?: {
    color?: string
    label?: string
  }
) {
  const params = new URLSearchParams()
  const normalizedColor = selection?.color?.trim()
  const normalizedLabel = selection?.label?.trim()

  if (normalizedColor) {
    params.set('color', normalizedColor)
  }

  if (normalizedLabel) {
    params.set('label', normalizedLabel)
  }

  const queryString = params.toString()
  return queryString ? `/products/${slug}?${queryString}` : `/products/${slug}`
}

export function ProductCard({ product, activeColor, activeLabel }: ProductCardProps) {
  const productImageUrl = getSelectionValue(product.displayImageUrl)
  const navigationColor = getSelectionValue(activeColor)
  const navigationLabel = getSelectionValue(activeLabel) ?? getSelectionValue(product.selection?.label)
  const categoryName = product.subcategory?.name ?? product.category.name
  const displayPrice = isFiniteNumber(product.displayPrice)
    ? product.displayPrice
    : isFiniteNumber(product.selection?.price)
      ? product.selection.price
      : null

  return (
    <Link
      href={buildProductHref(product.slug, {
        color: navigationColor,
        label: navigationLabel,
      })}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#f3f2ef]">
        {productImageUrl ? (
          <Image
            src={productImageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Imagem indisponível
          </div>
        )}
        {product.isLaunch ? (
          <Badge className="absolute left-3 top-3 rounded-full bg-white/96 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-foreground shadow-sm">
            {product.launchLabel ?? 'NOVO'}
          </Badge>
        ) : null}
        <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/3" />
      </div>
      <div className="mt-4 space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {categoryName}
        </p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground transition-opacity group-hover:opacity-70">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-foreground">
          {displayPrice === null ? 'Preço indisponível' : formatPrice(displayPrice)}
        </p>
      </div>
    </Link>
  )
}
