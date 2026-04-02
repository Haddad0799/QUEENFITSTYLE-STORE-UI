'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Color {
  colorName: string
  colorHex: string
}

interface ColorSelectorProps {
  colors: Color[]
  selectedColor: string
  onColorChange: (colorName: string) => void
}

export function ColorSelector({ colors, selectedColor, onColorChange }: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Cor</span>
        <span className="text-sm text-muted-foreground">{selectedColor}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = color.colorName === selectedColor
          const isLight = isLightColor(color.colorHex)
          
          return (
            <button
              key={color.colorName}
              onClick={() => onColorChange(color.colorName)}
              className={cn(
                "relative w-10 h-10 rounded-full border-2 transition-all",
                isSelected
                  ? "border-accent ring-2 ring-accent ring-offset-2"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
              style={{ backgroundColor: color.colorHex }}
              title={color.colorName}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "absolute inset-0 m-auto w-4 h-4",
                    isLight ? "text-foreground" : "text-background"
                  )}
                />
              )}
              <span className="sr-only">{color.colorName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to determine if a color is light
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
