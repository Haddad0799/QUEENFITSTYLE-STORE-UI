'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { CategoryTree } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: CategoryTree[]
  currentCategory?: string
  onChange: (patch: { category?: string | null }) => void
}

function hasSelectedDescendant(category: CategoryTree, currentCategory?: string): boolean {
  return category.subcategories.some((subcategory) => {
    if (subcategory.slug === currentCategory) {
      return true
    }

    return hasSelectedDescendant(subcategory, currentCategory)
  })
}

export function CategoryFilter({
  categories,
  currentCategory,
  onChange,
}: CategoryFilterProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        Nenhuma categoria disponível no momento.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange({ category: null })}
        className={cn(
          'relative flex w-full items-center rounded-2xl px-4 py-3 pr-9 text-left text-sm transition-all duration-200',
          !currentCategory
            ? 'bg-[#f1ece3] font-medium text-foreground'
            : 'text-muted-foreground hover:bg-white hover:text-foreground'
        )}
      >
        <span className="min-w-0 pr-1">Todas as categorias</span>
        <CheckIndicator active={!currentCategory} />
      </button>

      {categories.map((category) => (
        <CategoryGroup
          key={category.id}
          category={category}
          currentCategory={currentCategory}
          onChange={onChange}
        />
      ))}
    </div>
  )
}

function CategoryGroup({
  category,
  currentCategory,
  onChange,
}: {
  category: CategoryTree
  currentCategory?: string
  onChange: (patch: { category?: string | null }) => void
}) {
  const hasChildren = category.subcategories.length > 0
  const isCurrentCategory = currentCategory === category.slug
  const hasActiveChild = hasSelectedDescendant(category, currentCategory)
  const isActive = isCurrentCategory || hasActiveChild
  const [open, setOpen] = useState(isActive)

  useEffect(() => {
    if (isActive) {
      setOpen(true)
    }
  }, [isActive])

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onChange({ category: category.slug })}
        className={cn(
          'relative flex w-full items-center rounded-2xl px-4 py-3 pr-9 text-left text-sm transition-all duration-200',
          isCurrentCategory
            ? 'bg-[#f1ece3] font-medium text-foreground'
            : 'text-muted-foreground hover:bg-white hover:text-foreground'
        )}
      >
        <span className="min-w-0 pr-1">{category.name}</span>
        <CheckIndicator active={isCurrentCategory} />
      </button>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-[1.35rem] border border-transparent px-2 py-2 transition-colors',
          isActive ? 'bg-[#f7f3ec]' : 'hover:bg-white'
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ category: category.slug })}
            className="relative flex flex-1 items-center rounded-xl px-2 py-2 pr-9 text-left"
          >
            <span
              className={cn(
                'min-w-0 pr-1 text-sm transition-colors',
                isActive ? 'font-medium text-foreground' : 'text-foreground/78'
              )}
            >
              {category.name}
            </span>
            <CheckIndicator active={isCurrentCategory} />
          </button>

          <CollapsibleTrigger
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            aria-label={`${open ? 'Recolher' : 'Expandir'} ${category.name}`}
          >
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-1 pt-1">
          {category.subcategories.map((subcategory) => {
            const isSelected = currentCategory === subcategory.slug

            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onChange({ category: subcategory.slug })}
                className={cn(
                  'relative flex w-full items-center rounded-xl px-4 py-2.5 pr-9 text-left text-sm transition-all duration-200',
                  isSelected
                    ? 'bg-white font-medium text-foreground shadow-[0_6px_16px_rgba(15,15,15,0.06)]'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground'
                )}
              >
                <span className="min-w-0 pr-1">{subcategory.name}</span>
                <CheckIndicator active={isSelected} />
              </button>
            )
          })}
        </CollapsibleContent>
      </div>
    </Collapsible>
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
