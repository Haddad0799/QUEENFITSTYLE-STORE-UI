'use client'

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, Heart, Truck, RotateCcw, Shield, Check } from 'lucide-react'
import type { ProductDetail, ProductColor, ProductSku } from '@/lib/types'
import { formatPrice } from '@/lib/api'
import {
  findColorByName,
  getPreferredSku,
  resolveInitialProductSelection,
} from '@/lib/product-selection'
import { Button } from '@/components/ui/button'
import {
  buildNavigationSignature,
  useNavigationLoading,
} from '@/components/navigation/navigation-loading-provider'
import { ImageGallery } from '@/components/product/image-gallery'
import { ColorSelector } from '@/components/product/color-selector'
import { SizeSelector } from '@/components/product/size-selector'
import { useCart } from '@/src/hooks/useCart'
import { getInventoryErrorMessage } from '@/src/services/inventory.service'


interface ProductDetailClientProps {
  product: ProductDetail
  priceDisplay: string
  initialColorName?: string
  initialLabel?: string
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
  const { beginNavigation } = useNavigationLoading()
  const { addItem, isSkuLoading } = useCart()
  const requestedColorName = searchParams.get('color')?.trim() || initialColorName
  const requestedLabel = searchParams.get('label')?.trim() || initialLabel
  const defaultColorName = product.mainColor?.name
  const defaultLabel = product.defaultSelection?.label
  const resolvedSelection = useMemo(
    () =>
      resolveInitialProductSelection({
        colors: product.colors,
        requestedColorName,
        defaultColorName,
        requestedLabel,
        defaultLabel,
      }),
    [defaultColorName, defaultLabel, product.colors, requestedColorName, requestedLabel]
  )
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    () => resolvedSelection.selectedColor
  )
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(
    () => resolvedSelection.selectedSku
  )
  const [addToCartError, setAddToCartError] = useState<string | null>(null)

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
    const fallbackImageUrl = product.displayImageUrl ?? product.mainImageUrl
    return fallbackImageUrl ? [fallbackImageUrl] : []
  }, [product.displayImageUrl, product.mainImageUrl, selectedColor])

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
      const nextHref = queryString ? `${pathname}?${queryString}` : pathname
      const currentHref = buildNavigationSignature(pathname, searchParams)

      if (nextHref === currentHref) {
        return
      }

      beginNavigation()
      startTransition(() => {
        router.replace(nextHref, {
          scroll: false,
        })
      })
    },
    [beginNavigation, pathname, router, searchParams]
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
  const isAddToCartLoading = selectedSku ? isSkuLoading(selectedSku.code) : false

  const handleAddToCart = useCallback(async () => {
    if (!selectedSku || !isInStock) {
      return
    }

    setAddToCartError(null)

    try {
      const result = await addItem({
        skuCode: selectedSku.code,
        name: product.name,
        image: currentImages[0] ?? '',
        price: selectedSku.sellingPrice,
        quantity: 1,
      })

      if (!result.ok) {
        setAddToCartError(result.message ?? 'Não foi possível adicionar o item.')
      }
    } catch (error) {
      setAddToCartError(getInventoryErrorMessage(error))
    }
  }, [
    addItem,
    currentImages,
    isInStock,
    product.name,
    selectedSku,
  ])

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
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              disabled={!isInStock || !selectedSku || isAddToCartLoading}
              onClick={() => void handleAddToCart()}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {isInStock
                ? isAddToCartLoading
                  ? 'Adicionando...'
                  : 'Adicionar ao Carrinho'
                : 'Produto Esgotado'}
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-5 w-5" />
              <span className="sr-only">Adicionar aos favoritos</span>
            </Button>
          </div>
          {addToCartError && (
            <p className="text-sm text-destructive">{addToCartError}</p>
          )}
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

