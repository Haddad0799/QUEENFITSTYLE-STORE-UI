'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, Heart, Truck, RotateCcw, Shield, Check } from 'lucide-react'
import type { ProductDetail, ProductColor, ProductSku } from '@/lib/types'
import { formatPrice } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ImageGallery } from '@/components/product/image-gallery'
import { ColorSelector } from '@/components/product/color-selector'
import { SizeSelector } from '@/components/product/size-selector'

interface ProductDetailClientProps {
  product: ProductDetail
  priceDisplay: string
  initialColorName?: string
  initialLabel?: string
}

function normalizeText(value?: string | null) {
  const normalizedValue = value?.trim()
  return normalizedValue ? normalizedValue.toLocaleLowerCase('pt-BR') : undefined
}

function findColorByName(colors: ProductColor[], colorName?: string | null) {
  const normalizedRequestedColor = normalizeText(colorName)

  if (!normalizedRequestedColor) {
    return null
  }

  return (
    colors.find(
      (color) => normalizeText(color.colorName) === normalizedRequestedColor
    ) ?? null
  )
}

function getFirstColor(colors: ProductColor[]) {
  return colors[0] ?? null
}

function getPreferredSku(color: ProductColor | null) {
  if (!color) {
    return null
  }

  return color.skus.find((sku) => sku.inStock) ?? null
}

function findSkuByLabel(color: ProductColor | null, label?: string | null) {
  const normalizedRequestedLabel = normalizeText(label)

  if (!color || !normalizedRequestedLabel) {
    return null
  }

  return (
    color.skus.find((sku) => normalizeText(sku.sizeName) === normalizedRequestedLabel) ?? null
  )
}

function resolveSelection(
  colors: ProductColor[],
  requestedColorName?: string,
  defaultColorName?: string,
  requestedLabel?: string
) {
  const selectedColor =
    findColorByName(colors, requestedColorName) ??
    findColorByName(colors, defaultColorName) ??
    getFirstColor(colors)
  const selectedSku =
    findSkuByLabel(selectedColor, requestedLabel) ?? getPreferredSku(selectedColor)

  return {
    selectedColor,
    selectedSku,
  }
}

export function ProductDetailClient({
  product,
  priceDisplay,
  initialColorName,
  initialLabel,
}: ProductDetailClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedColorName = searchParams.get('color')?.trim() || initialColorName
  const requestedLabel = searchParams.get('label')?.trim() || initialLabel
  const defaultColorName = product.mainColor?.name
  const resolvedSelection = useMemo(
    () =>
      resolveSelection(
        product.colors,
        requestedColorName,
        defaultColorName,
        requestedLabel
      ),
    [defaultColorName, product.colors, requestedColorName, requestedLabel]
  )
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    () => resolvedSelection.selectedColor
  )
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(
    () => resolvedSelection.selectedSku
  )

  useEffect(() => {
    setSelectedColor((currentColor) =>
      currentColor?.colorName === resolvedSelection.selectedColor?.colorName
        ? currentColor
        : resolvedSelection.selectedColor
    )
    setSelectedSku((currentSku) =>
      currentSku?.code === resolvedSelection.selectedSku?.code
        ? currentSku
        : resolvedSelection.selectedSku
    )
  }, [resolvedSelection])

  // Get current images based on selected color
  const currentImages = useMemo(() => {
    if (selectedColor?.imageUrls?.length) {
      return selectedColor.imageUrls
    }
    return product.mainImageUrl ? [product.mainImageUrl] : []
  }, [selectedColor, product.mainImageUrl])

  // Get current price based on selected SKU
  const currentPrice = useMemo(() => {
    if (selectedSku) {
      return formatPrice(selectedSku.sellingPrice)
    }
    return priceDisplay
  }, [selectedSku, priceDisplay])

  const syncSelectionSearchParams = useCallback(
    (selection: { colorName?: string; label?: string }) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString())
      const normalizedColorName = selection.colorName?.trim()
      const normalizedLabel = selection.label?.trim()

      if (normalizedColorName) {
        nextSearchParams.set('color', normalizedColorName)
      } else {
        nextSearchParams.delete('color')
      }

      if (normalizedLabel) {
        nextSearchParams.set('label', normalizedLabel)
      } else {
        nextSearchParams.delete('label')
      }

      const queryString = nextSearchParams.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams]
  )

  // Handle color change
  const handleColorChange = useCallback((colorName: string) => {
    const color = findColorByName(product.colors, colorName)
    if (color) {
      const nextSku = getPreferredSku(color)
      setSelectedColor(color)
      setSelectedSku(nextSku)
      syncSelectionSearchParams({
        colorName: color.colorName,
        label: nextSku?.sizeName,
      })
    }
  }, [product.colors, syncSelectionSearchParams])

  // Handle size change
  const handleSizeChange = useCallback((sizeName: string) => {
    if (selectedColor) {
      const sku = selectedColor.skus.find((s) => s.sizeName === sizeName)

      if (!sku) {
        return
      }

      setSelectedSku(sku)
      syncSelectionSearchParams({
        colorName: selectedColor.colorName,
        label: sku.sizeName,
      })
    }
  }, [selectedColor, syncSelectionSearchParams])

  // Check stock status
  const isInStock = selectedSku?.inStock ?? false
  const stockQuantity = selectedSku?.availableStock ?? 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <ImageGallery images={currentImages} productName={product.name} />

      {/* Product Info */}
      <div className="space-y-6">
        {/* Category & Name */}
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
            {product.categoryName}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground text-balance">
            {product.name}
          </h1>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4">
          <span className="text-2xl font-semibold text-foreground">
            {currentPrice}
          </span>
          {isInStock ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Em estoque
            </span>
          ) : (
            <span className="text-sm text-destructive">Esgotado</span>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Color Selector */}
        {product.colors.length > 0 && (
          <ColorSelector
            colors={product.colors.map((c) => ({
              colorName: c.colorName,
              colorHex: c.colorHex,
            }))}
            selectedColor={selectedColor?.colorName || ''}
            onColorChange={handleColorChange}
          />
        )}

        {/* Size Selector */}
        {selectedColor && selectedColor.skus.length > 0 && (
          <SizeSelector
            skus={selectedColor.skus}
            selectedSize={selectedSku?.sizeName || ''}
            onSizeChange={handleSizeChange}
          />
        )}

        {/* Stock Info */}
        {isInStock && stockQuantity > 0 && stockQuantity <= 5 && (
          <p className="text-sm text-amber-600">
            Apenas {stockQuantity} unidade{stockQuantity > 1 ? 's' : ''} disponível{stockQuantity > 1 ? 'is' : ''}!
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            size="lg"
            className="flex-1"
            disabled={!isInStock || !selectedSku}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {isInStock ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
          </Button>
          <Button size="lg" variant="outline">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Adicionar aos favoritos</span>
          </Button>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Frete grátis acima de R$ 199</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Troca fácil em 30 dias</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Compra segura</span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="pt-6 border-t border-border">
            <h2 className="font-semibold text-foreground mb-3">Descrição</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="leading-relaxed">{product.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
