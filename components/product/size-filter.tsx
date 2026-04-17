'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SizeFilterProps {
  sizes: string[]
  currentLabel?: string
  onChange: (patch: { label?: string | null }) => void
}

export function SizeFilter({ sizes, currentLabel, onChange }: SizeFilterProps) {
  if (sizes.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Nenhum tamanho disponível neste contexto.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-2">
      <button
        type="button"
        onClick={() => onChange({ label: null })}
        className={cn(
          'relative flex min-h-11 items-center rounded-2xl border px-3 py-3 pr-8 text-sm font-medium transition-all duration-200',
          !currentLabel
            ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
            : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
        )}
      >
        <span className="min-w-0 pr-1 text-left">Todas</span>
        <CheckIndicator active={!currentLabel} />
      </button>

      {sizes.map((size) => {
        const isActive = currentLabel === size

        return (
          <button
            key={size}
            type="button"
            onClick={() => onChange({ label: size })}
            aria-pressed={isActive}
            className={cn(
              'relative flex min-h-11 items-center rounded-2xl border px-3 py-3 pr-8 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
                : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
            )}
          >
            <span className="min-w-0 pr-1 text-left">{size}</span>
            <CheckIndicator active={isActive} />
          </button>
        )
      })}
    </div>
  )
}

function CheckIndicator({ active }: { active: boolean }) {
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
