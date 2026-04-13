'use client'

import { Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductSku } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface SizeSelectorProps {
  skus: ProductSku[]
  selectedSize: string
  onSizeChange: (sizeName: string) => void
}

export function SizeSelector({ skus, selectedSize, onSizeChange }: SizeSelectorProps) {
  const hasAnyDimensions = skus.some(
    (sku) => sku.width > 0 || sku.height > 0 || sku.length > 0
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Tamanho</span>
        {hasAnyDimensions && (
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm text-accent hover:underline inline-flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                Guia de tamanhos
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Guia de Tamanhos
                </DialogTitle>
                <DialogDescription>
                  Medidas de cada tamanho disponível para este produto.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 pr-4 font-medium text-muted-foreground">Tamanho</th>
                      <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Largura (cm)</th>
                      <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Altura (cm)</th>
                      <th className="text-center py-2.5 pl-2 font-medium text-muted-foreground">Comprimento (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skus.map((sku) => (
                      <tr
                        key={sku.code}
                        className={cn(
                          'border-b border-border/50 transition-colors',
                          sku.sizeName === selectedSize && 'bg-accent/10 font-medium'
                        )}
                      >
                        <td className="py-2.5 pr-4 font-medium">
                          {sku.sizeName}
                          {sku.sizeName === selectedSize && (
                            <span className="ml-1.5 text-xs text-accent">(selecionado)</span>
                          )}
                        </td>
                        <td className="text-center py-2.5 px-2">{sku.width > 0 ? sku.width : '—'}</td>
                        <td className="text-center py-2.5 px-2">{sku.height > 0 ? sku.height : '—'}</td>
                        <td className="text-center py-2.5 pl-2">{sku.length > 0 ? sku.length : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
