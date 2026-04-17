'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { buildCategoryValue, findCategorySelection } from '@/lib/category-tree'
import type { CategoryTree } from '@/lib/types'
import { cn } from '@/lib/utils'

const PRIMARY_CATEGORY_ORDER = ['conjuntos', 'roupas']
type CategoryLoadState = 'loading' | 'ready' | 'unavailable'

const COLOR_OPTIONS = [
  { label: 'Todas', value: 'all', swatch: 'linear-gradient(135deg,#111111 0%,#f7f3ec 100%)' },
  { label: 'Preto', value: 'preto', swatch: '#171717' },
  { label: 'Off-white', value: 'off-white', swatch: '#f3eee6' },
  { label: 'Areia', value: 'areia', swatch: '#d8c4a8' },
  { label: 'Rosa', value: 'rosa', swatch: '#d78a9c' },
  { label: 'Oliva', value: 'oliva', swatch: '#75816d' },
]

const SIZE_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'PP', value: 'PP' },
  { label: 'P', value: 'P' },
  { label: 'M', value: 'M' },
  { label: 'G', value: 'G' },
  { label: 'GG', value: 'GG' },
]

interface ActiveFilter {
  key: string
  label: string
  clear: Record<string, string | null>
}

function findCategoryName(categories: CategoryTree[], normalizedName: string): string | undefined {
  return findCategorySelection(categories, normalizedName)?.label
}

function getPrimaryCategories(categories: CategoryTree[]) {
  return PRIMARY_CATEGORY_ORDER.map((slug) =>
    categories.find((category) => category.slug === slug || category.normalizedName === slug)
  ).filter(Boolean) as CategoryTree[]
}

function getColorLabel(value: string) {
  return COLOR_OPTIONS.find((option) => option.value === value)?.label ?? value
}

function getSizeLabel(value: string) {
  return SIZE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function ProductFilters() {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [categoryLoadState, setCategoryLoadState] = useState<CategoryLoadState>('loading')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: CategoryTree[]) => {
        if (data.length > 0) {
          setCategories(data)
          setCategoryLoadState('ready')
          return
        }

        setCategories([])
        setCategoryLoadState('unavailable')
      })
      .catch(() => {
        setCategories([])
        setCategoryLoadState('unavailable')
      })
  }, [])

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key)
        } else {
          nextParams.set(key, value)
        }
      })

      nextParams.delete('page')

      return nextParams.toString()
    },
    [searchParams]
  )

  const applyFilters = useCallback(
    (params: Record<string, string | null>) => {
      const queryString = createQueryString(params)
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
      setIsMobileFiltersOpen(false)
    },
    [createQueryString, pathname, router]
  )

  const clearAllFilters = useCallback(() => {
    router.push(pathname)
    setIsMobileFiltersOpen(false)
  }, [pathname, router])

  const currentCategoryValue = searchParams.get('category') || 'all'
  const currentColorValue = searchParams.get('color') || 'all'
  const currentSizeValue = searchParams.get('size') || 'all'
  const currentSelection =
    currentCategoryValue !== 'all'
      ? findCategorySelection(categories, currentCategoryValue)
      : null
  const activePathIds = new Set(currentSelection?.path.map((item) => item.id) ?? [])
  const primaryCategories = useMemo(() => getPrimaryCategories(categories), [categories])
  const activeFilters = useMemo(() => {
    const nextFilters: ActiveFilter[] = []
    const search = searchParams.get('search')
    const min = searchParams.get('minPrice')
    const max = searchParams.get('maxPrice')

    if (search) {
      nextFilters.push({
        key: 'search',
        label: `Busca: ${search}`,
        clear: { search: null },
      })
    }

    if (currentCategoryValue !== 'all') {
      nextFilters.push({
        key: 'category',
        label: findCategoryName(categories, currentCategoryValue) ?? currentCategoryValue,
        clear: { category: null },
      })
    }

    if (currentColorValue !== 'all') {
      nextFilters.push({
        key: 'color',
        label: `Cor: ${getColorLabel(currentColorValue)}`,
        clear: { color: null },
      })
    }

    if (currentSizeValue !== 'all') {
      nextFilters.push({
        key: 'size',
        label: `Tamanho: ${getSizeLabel(currentSizeValue)}`,
        clear: { size: null },
      })
    }

    if (min || max) {
      nextFilters.push({
        key: 'price',
        label: `Preço: R$ ${min || '0'} - R$ ${max || 'sem limite'}`,
        clear: { minPrice: null, maxPrice: null },
      })
    }

    return nextFilters
  }, [categories, currentCategoryValue, currentColorValue, currentSizeValue, searchParams])

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
                <SheetTitle className="text-xl tracking-tight">Filtrar coleção</SheetTitle>
                <SheetDescription>
                  Refine a vitrine por categoria, cor, tamanho e faixa de preço.
                </SheetDescription>
              </SheetHeader>

              <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-5">
                <FilterPanel
                  categories={primaryCategories}
                  categoryLoadState={categoryLoadState}
                  activePathIds={activePathIds}
                  activeFilters={activeFilters}
                  currentCategoryValue={currentCategoryValue}
                  currentColorValue={currentColorValue}
                  currentSizeValue={currentSizeValue}
                  minPrice={searchParams.get('minPrice') || ''}
                  maxPrice={searchParams.get('maxPrice') || ''}
                  onApplyFilters={applyFilters}
                  onClearAll={clearAllFilters}
                  renderClose={(children) => <SheetClose asChild>{children}</SheetClose>}
                />
              </div>
            </SheetContent>
          </Sheet>

          {activeFilters.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearAllFilters}
              className="h-11 rounded-full px-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>

        {activeFilters.length > 0 ? (
          <ActiveFilterRow filters={activeFilters} onRemove={applyFilters} />
        ) : null}
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
                onClick={clearAllFilters}
                className="h-auto rounded-full px-0 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                Limpar
              </Button>
            ) : null}
          </div>

          <div className="pt-5">
            <FilterPanel
              categories={primaryCategories}
              categoryLoadState={categoryLoadState}
              activePathIds={activePathIds}
              activeFilters={activeFilters}
              currentCategoryValue={currentCategoryValue}
              currentColorValue={currentColorValue}
              currentSizeValue={currentSizeValue}
              minPrice={searchParams.get('minPrice') || ''}
              maxPrice={searchParams.get('maxPrice') || ''}
              onApplyFilters={applyFilters}
              onClearAll={clearAllFilters}
            />
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-4">
            <ActiveFilterRow filters={activeFilters} onRemove={applyFilters} />
          </div>
        ) : null}
      </aside>
    </>
  )
}

function FilterPanel({
  categories,
  categoryLoadState,
  activePathIds,
  activeFilters,
  currentCategoryValue,
  currentColorValue,
  currentSizeValue,
  minPrice,
  maxPrice,
  onApplyFilters,
  onClearAll,
  renderClose,
}: {
  categories: CategoryTree[]
  categoryLoadState: CategoryLoadState
  activePathIds: Set<number>
  activeFilters: ActiveFilter[]
  currentCategoryValue: string
  currentColorValue: string
  currentSizeValue: string
  minPrice: string
  maxPrice: string
  onApplyFilters: (params: Record<string, string | null>) => void
  onClearAll: () => void
  renderClose?: (children: ReactNode) => ReactNode
}) {
  return (
    <div className="space-y-6">
      <FilterSection title="Categorias" eyebrow="Explore por grupo" defaultOpen>
        {categoryLoadState === 'loading' ? (
          <CategorySectionSkeleton />
        ) : categories.length > 0 ? (
          <CategorySection
            categories={categories}
            activePathIds={activePathIds}
            currentValue={currentCategoryValue}
            onSelect={(value) => onApplyFilters({ category: value === 'all' ? null : value })}
          />
        ) : (
          <CategoryUnavailableState />
        )}
      </FilterSection>

      <FilterSection title="Cores" eyebrow="Paleta da coleção" defaultOpen>
        <ColorSection
          currentValue={currentColorValue}
          onSelect={(value) => onApplyFilters({ color: value === 'all' ? null : value })}
        />
      </FilterSection>

      <FilterSection title="Tamanhos" eyebrow="Escolha o caimento" defaultOpen>
        <SizeSection
          currentValue={currentSizeValue}
          onSelect={(value) => onApplyFilters({ size: value === 'all' ? null : value })}
        />
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Priorize o caimento ideal e refine a vitrine com mais rapidez.
        </p>
      </FilterSection>

      <FilterSection title="Preço" eyebrow="Faixa ideal" defaultOpen>
        <PriceSection
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApply={(nextMin, nextMax) =>
            onApplyFilters({
              minPrice: nextMin || null,
              maxPrice: nextMax || null,
            })
          }
        />
      </FilterSection>

      {activeFilters.length > 0 ? (
        <div className="rounded-[1.5rem] border border-black/6 bg-white/80 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-muted-foreground">
            Ajustes ativos
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeFilters.length} filtro{activeFilters.length > 1 ? 's' : ''} influenciando a
            vitrine agora.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={onClearAll}
            className="mt-3 h-auto rounded-full px-0 py-1 text-sm font-medium text-foreground hover:bg-transparent hover:text-accent"
          >
            Limpar filtros
          </Button>
          {renderClose ? (
            renderClose(
              <Link
                href="/products"
                className="mt-2 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver todos os produtos
              </Link>
            )
          ) : (
            <Link
              href="/products"
              className="mt-2 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver todos os produtos
            </Link>
          )}
        </div>
      ) : null}
    </div>
  )
}

function CategorySectionSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-12 animate-pulse rounded-2xl bg-[#f1ece3]"
        />
      ))}
    </div>
  )
}

function CategoryUnavailableState() {
  return (
    <div className="rounded-[1.35rem] border border-black/6 bg-white/80 p-4">
      <p className="text-sm font-medium text-foreground">Categorias indisponíveis agora</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        A navegação por grupos não carregou no momento. Você ainda pode usar cor, tamanho,
        preço ou explorar a vitrine completa.
      </p>
      <Link
        href="/products"
        className="mt-3 inline-flex text-sm font-medium text-foreground transition-colors hover:text-accent"
      >
        Ver todos os produtos
      </Link>
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

function CategorySection({
  categories,
  currentValue,
  activePathIds,
  onSelect,
}: {
  categories: CategoryTree[]
  currentValue: string
  activePathIds: Set<number>
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200',
          currentValue === 'all'
            ? 'bg-[#f1ece3] font-medium text-foreground'
            : 'text-muted-foreground hover:bg-white hover:text-foreground'
        )}
      >
        <span>Todas</span>
        {currentValue === 'all' ? <Check className="h-4 w-4" /> : null}
      </button>

      {categories.map((category) => (
        <CategoryGroupItem
          key={category.id}
          category={category}
          currentValue={currentValue}
          activePathIds={activePathIds}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function CategoryGroupItem({
  category,
  currentValue,
  activePathIds,
  onSelect,
}: {
  category: CategoryTree
  currentValue: string
  activePathIds: Set<number>
  onSelect: (value: string) => void
}) {
  const groupValue = buildCategoryValue([category])
  const isActiveGroup = activePathIds.has(category.id)
  const isSelected = currentValue === groupValue
  const [open, setOpen] = useState(isActiveGroup)

  useEffect(() => {
    if (isActiveGroup) {
      setOpen(true)
    }
  }, [isActiveGroup])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-[1.35rem] border border-transparent px-2 py-2 transition-colors',
          isActiveGroup || isSelected ? 'bg-[#f7f3ec]' : 'hover:bg-white'
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onSelect(groupValue)
              setOpen(true)
            }}
            className="flex flex-1 items-center justify-between rounded-xl px-2 py-2 text-left"
          >
            <span
              className={cn(
                'text-sm transition-colors',
                isActiveGroup || isSelected ? 'font-medium text-foreground' : 'text-foreground/78'
              )}
            >
              {category.name}
            </span>
            {isSelected ? <Check className="h-4 w-4 text-foreground" /> : null}
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
            const value = buildCategoryValue([category, subcategory])
            const isSelectedSubcategory = currentValue === value

            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onSelect(value)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-200',
                  isSelectedSubcategory
                    ? 'bg-white font-medium text-foreground shadow-[0_6px_16px_rgba(15,15,15,0.06)]'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground'
                )}
              >
                <span>{subcategory.name}</span>
                {isSelectedSubcategory ? <Check className="h-4 w-4" /> : null}
              </button>
            )
          })}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function ColorSection({
  currentValue,
  onSelect,
}: {
  currentValue: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {COLOR_OPTIONS.map((option) => {
        const isActive = currentValue === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-3 rounded-full border px-3 py-2.5 text-left text-sm transition-all duration-200',
              isActive
                ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
                : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
            )}
          >
            <span
              className="size-3.5 rounded-full ring-1 ring-black/10"
              style={{ background: option.swatch }}
            />
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function SizeSection({
  currentValue,
  onSelect,
}: {
  currentValue: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SIZE_OPTIONS.map((option) => {
        const isActive = currentValue === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={isActive}
            className={cn(
              'rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-foreground bg-white text-foreground shadow-[0_10px_24px_rgba(15,15,15,0.06)]'
                : 'border-transparent bg-[#f4efe7] text-muted-foreground hover:border-black/6 hover:bg-white hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PriceSection({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice: string
  maxPrice: string
  onApply: (min: string, max: string) => void
}) {
  const id = useId()
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)

  useEffect(() => {
    setMin(minPrice)
    setMax(maxPrice)
  }, [maxPrice, minPrice])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onApply(min, max)
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${id}-min`} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Mínimo
          </Label>
          <Input
            id={`${id}-min`}
            type="number"
            inputMode="numeric"
            placeholder="R$ 0"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            className="h-11 rounded-2xl border-black/8 bg-white shadow-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-max`} className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Máximo
          </Label>
          <Input
            id={`${id}-max`}
            type="number"
            inputMode="numeric"
            placeholder="R$ 500"
            value={max}
            onChange={(event) => setMax(event.target.value)}
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
  onRemove: (params: Record<string, string | null>) => void
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
