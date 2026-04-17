'use client'

import type { ReactNode } from 'react'
import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CategoryFilter } from '@/components/product/category-filter'
import { ColorFilter } from '@/components/product/color-filter'
import { SizeFilter } from '@/components/product/size-filter'
import { useCatalogFilterNavigation } from '@/hooks/use-catalog-filter-navigation'
import { findCategorySelection } from '@/lib/category-tree'
import type { AvailableCatalogFilters, CategoryTree } from '@/lib/types'

interface ProductFiltersProps {
  categories: CategoryTree[]
  availableFilters: AvailableCatalogFilters
}

interface ActiveFilter {
  key: string
  label: string
  clear: Record<string, string | number | null>
}

export function ProductFilters({ categories, availableFilters }: ProductFiltersProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const { currentFilters, updateFilters, clearAll } = useCatalogFilterNavigation()

  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const nextFilters: ActiveFilter[] = []
    const selectedCategory = currentFilters.category
      ? findCategorySelection(categories, currentFilters.category)
      : null

    if (currentFilters.search) {
      nextFilters.push({
        key: 'search',
        label: `Busca: ${currentFilters.search}`,
        clear: { search: null },
      })
    }

    if (selectedCategory) {
      nextFilters.push({
        key: 'category',
        label: selectedCategory.label,
        clear: { category: null },
      })
    }

    if (currentFilters.color) {
      nextFilters.push({
        key: 'color',
        label: `Cor: ${currentFilters.color}`,
        clear: { color: null },
      })
    }

    if (currentFilters.label) {
      nextFilters.push({
        key: 'label',
        label: `Tamanho: ${currentFilters.label}`,
        clear: { label: null },
      })
    }

    if (
      typeof currentFilters.minPrice === 'number' ||
      typeof currentFilters.maxPrice === 'number'
    ) {
      nextFilters.push({
        key: 'price',
        label: `Preço: R$ ${currentFilters.minPrice ?? 0} - R$ ${
          currentFilters.maxPrice ?? 'sem limite'
        }`,
        clear: { minPrice: null, maxPrice: null },
      })
    }

    return nextFilters
  }, [categories, currentFilters])

  const handleFilterChange = (patch: Record<string, string | number | null>) => {
    updateFilters(patch)
    setIsMobileFiltersOpen(false)
  }

  const handleClearAll = () => {
    clearAll()
    setIsMobileFiltersOpen(false)
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-full border-black/8 bg-white px-5 text-sm font-medium shadow-none hover:bg-[#faf7f1]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilters.length > 0 ? (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                    {activeFilters.length}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[92vw] max-w-[420px] border-r border-border/70 px-0">
              <SheetHeader className="border-b border-border/70 px-6 pb-5 pt-6 text-left">
                <SheetTitle className="text-xl tracking-tight">Filtrar catálogo</SheetTitle>
                <SheetDescription>
                  As opções são atualizadas dinamicamente conforme o contexto da busca.
                </SheetDescription>
              </SheetHeader>

              <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-5">
                <FilterPanel
                  categories={categories}
                  availableFilters={availableFilters}
                  currentFilters={currentFilters}
                  activeFilters={activeFilters}
                  onChange={handleFilterChange}
                  onClearAll={handleClearAll}
                  renderClose={(children) => <SheetClose asChild>{children}</SheetClose>}
                />
              </div>
            </SheetContent>
          </Sheet>

          {activeFilters.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearAll}
              className="h-11 rounded-full px-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>

      </div>

      <aside className="hidden self-start lg:sticky lg:top-28 lg:block">
        <div className="rounded-[2rem] border border-black/5 bg-[#fcfbf8]/95 p-6 shadow-[0_18px_44px_rgba(15,15,15,0.04)]">
          <div className="flex items-start justify-between gap-4 border-b border-black/6 pb-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Refinar vitrine
              </p>
              <h2 className="mt-2 font-serif text-[1.65rem] leading-none tracking-tight text-foreground">
                Filtros
              </h2>
            </div>

            {activeFilters.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearAll}
                className="h-auto rounded-full px-0 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                Limpar
              </Button>
            ) : null}
          </div>

          <div className="pt-5">
            <FilterPanel
              categories={categories}
              availableFilters={availableFilters}
              currentFilters={currentFilters}
              activeFilters={activeFilters}
              onChange={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </aside>
    </>
  )
}

function FilterPanel({
  categories,
  availableFilters,
  currentFilters,
  activeFilters,
  onChange,
  onClearAll,
  renderClose,
}: {
  categories: CategoryTree[]
  availableFilters: AvailableCatalogFilters
  currentFilters: ReturnType<typeof useCatalogFilterNavigation>['currentFilters']
  activeFilters: ActiveFilter[]
  onChange: (patch: Record<string, string | number | null>) => void
  onClearAll: () => void
  renderClose?: (children: ReactNode) => ReactNode
}) {
  return (
    <div className="space-y-6">
      {activeFilters.length > 0 ? (
        <div className="rounded-[1.5rem] border border-black/6 bg-white/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            Ajustes ativos
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeFilters.length} filtro{activeFilters.length > 1 ? 's' : ''} influenciando a
            vitrine agora.
          </p>
          <div className="mt-3">
            <ActiveFilterRow filters={activeFilters} onRemove={onChange} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClearAll}
              className="h-auto rounded-full px-0 py-1 text-sm font-medium text-foreground hover:bg-transparent hover:text-accent"
            >
              Limpar filtros
            </Button>
            {renderClose ? (
              renderClose(
                <Link
                  href="/products"
                  className="inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todos os produtos
                </Link>
              )
            ) : (
              <Link
                href="/products"
                className="inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver todos os produtos
              </Link>
            )}
          </div>
        </div>
      ) : null}

      <FilterSection title="Categorias" eyebrow="Navegação" defaultOpen>
        <CategoryFilter
          categories={categories}
          currentCategory={currentFilters.category}
          onChange={onChange}
        />
      </FilterSection>

      <FilterSection title="Cores" eyebrow="Facetas disponíveis" defaultOpen>
        <ColorFilter
          colors={availableFilters.colors}
          currentColor={currentFilters.color}
          onChange={onChange}
        />
      </FilterSection>

      <FilterSection title="Tamanhos" eyebrow="Escolha o caimento" defaultOpen>
        <SizeFilter
          sizes={availableFilters.sizes}
          currentLabel={currentFilters.label}
          onChange={onChange}
        />
      </FilterSection>

      <FilterSection title="Preço" eyebrow="Faixa ideal" defaultOpen>
        <PriceFilter
          minPrice={currentFilters.minPrice}
          maxPrice={currentFilters.maxPrice}
          onApply={(nextMin, nextMax) =>
            onChange({
              minPrice: nextMin,
              maxPrice: nextMax,
            })
          }
        />
      </FilterSection>
    </div>
  )
}

function FilterSection({
  title,
  eyebrow,
  children,
  defaultOpen = true,
}: {
  title: string
  eyebrow: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t border-black/6 pt-5 first:border-t-0 first:pt-0">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 text-left">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
          <p className="mt-2 text-[1rem] font-medium text-foreground">{title}</p>
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-white text-muted-foreground transition-colors group-hover:text-foreground">
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function PriceFilter({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice?: number
  maxPrice?: number
  onApply: (minPrice: number | null, maxPrice: number | null) => void
}) {
  const inputId = useId()
  const [minValue, setMinValue] = useState(minPrice?.toString() ?? '')
  const [maxValue, setMaxValue] = useState(maxPrice?.toString() ?? '')

  useEffect(() => {
    setMinValue(minPrice?.toString() ?? '')
    setMaxValue(maxPrice?.toString() ?? '')
  }, [minPrice, maxPrice])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply(
          minValue ? Number(minValue) : null,
          maxValue ? Number(maxValue) : null
        )
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${inputId}-min`} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Mínimo
          </Label>
          <Input
            id={`${inputId}-min`}
            type="number"
            inputMode="numeric"
            placeholder="R$ 0"
            value={minValue}
            onChange={(event) => setMinValue(event.target.value)}
            className="h-11 rounded-2xl border-black/8 bg-white shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${inputId}-max`} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Máximo
          </Label>
          <Input
            id={`${inputId}-max`}
            type="number"
            inputMode="numeric"
            placeholder="R$ 500"
            value={maxValue}
            onChange={(event) => setMaxValue(event.target.value)}
            className="h-11 rounded-2xl border-black/8 bg-white shadow-none"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
      >
        Aplicar faixa
      </Button>
    </form>
  )
}

function ActiveFilterRow({
  filters,
  onRemove,
}: {
  filters: ActiveFilter[]
  onRemove: (patch: Record<string, string | number | null>) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white px-3 py-2 text-sm text-foreground shadow-[0_8px_20px_rgba(15,15,15,0.04)]"
        >
          {filter.label}
          <button
            type="button"
            onClick={() => onRemove(filter.clear)}
            className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remover filtro {filter.label}</span>
          </button>
        </span>
      ))}
    </div>
  )
}
