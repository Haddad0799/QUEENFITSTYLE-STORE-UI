'use client'

import { useState, useMemo } from 'react'
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
}

export function ProductDetailClient({ product, priceDisplay }: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(
    product.colors[0] || null
  )
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(
    product.colors[0]?.skus[0] || null
  )

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

  // Handle color change
  const handleColorChange = (colorName: string) => {
    const color = product.colors.find((c) => c.colorName === colorName)
    if (color) {
      setSelectedColor(color)
      // Auto-select first available SKU for new color
      const availableSku = color.skus.find((s) => s.inStock) || color.skus[0]
      setSelectedSku(availableSku || null)
    }
  }

  // Handle size change
  const handleSizeChange = (sizeName: string) => {
    if (selectedColor) {
      const sku = selectedColor.skus.find((s) => s.sizeName === sizeName)
      setSelectedSku(sku || null)
    }
  }

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
