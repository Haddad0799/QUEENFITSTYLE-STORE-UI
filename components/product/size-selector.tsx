'use client'

import { cn } from '@/lib/utils'
import type { ProductSku } from '@/lib/types'

interface SizeSelectorProps {
  skus: ProductSku[]
  selectedSize: string
  onSizeChange: (sizeName: string) => void
}

export function SizeSelector({ skus, selectedSize, onSizeChange }: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Tamanho</span>
        <button className="text-sm text-accent hover:underline">
          Guia de tamanhos
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skus.map((sku) => {
          const isSelected = sku.sizeName === selectedSize
          const isOutOfStock = !sku.inStock
          
          return (
            <button
              key={sku.code}
              onClick={() => !isOutOfStock && onSizeChange(sku.sizeName)}
              disabled={isOutOfStock}
              className={cn(
                "min-w-[48px] h-10 px-3 rounded-md border text-sm font-medium transition-all",
                isSelected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background text-foreground hover:border-accent",
                isOutOfStock && "opacity-40 cursor-not-allowed line-through"
              )}
              title={isOutOfStock ? 'Esgotado' : sku.sizeName}
            >
              {sku.sizeName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
