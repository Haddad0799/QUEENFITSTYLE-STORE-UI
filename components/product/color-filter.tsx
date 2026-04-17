'use client'

import { Check } from 'lucide-react'
import type { CatalogColorFacet } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ColorFilterProps {
  colors: CatalogColorFacet[]
  currentColor?: string
  onChange: (patch: { color?: string | null }) => void
}

export function ColorFilter({ colors, currentColor, onChange }: ColorFilterProps) {
  if (colors.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Nenhuma cor disponível neste contexto.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-2">
      <button
        type="button"
        onClick={() => onChange({ color: null })}
        className={cn(
          'relative flex min-h-12 items-center rounded-full border px-3 py-2.5 pr-9 text-left text-sm transition-all duration-200',
          !currentColor
            ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
            : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
        )}
      >
        <span className="min-w-0 pr-1">Todas</span>
        <CheckIndicator active={!currentColor} />
      </button>

      {colors.map((color) => {
        const isActive = currentColor === color.name

        return (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange({ color: color.name })}
            aria-pressed={isActive}
            className={cn(
              'relative flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-2.5 pr-9 text-left text-sm transition-all duration-200',
              isActive
                ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
                : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
            )}
          >
            <span className="flex min-w-0 items-center gap-3 pr-1">
              <span
                className="size-4 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              <span className="whitespace-normal break-words text-left leading-snug">
                {color.name}
              </span>
            </span>
            <CheckIndicator active={isActive} />
          </button>
        )
      })}
    </div>
  )
}

function CheckIndicator({
  active,
}: {
  active: boolean
}) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute right-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-foreground transition-opacity',
        active ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden="true"
    >
      <Check className="h-3.5 w-3.5" />
    </span>
  )
}
