'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { buildCategoryValue, findCategorySelection } from '@/lib/category-tree'
import type { CategoryTree } from '@/lib/types'
import { useIsMobile } from '@/hooks/use-mobile'

const CATEGORY_TRIGGER_CLASSNAME =
  'flex h-10 w-full items-center justify-between gap-2 rounded-none border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/30 sm:w-[220px]'

function findCategoryName(categories: CategoryTree[], normalizedName: string): string | undefined {
  return findCategorySelection(categories, normalizedName)?.label
}

export function ProductFilters() {
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  useEffect(() => {
    fetch('/api/categories?tree=true')
      .then((res) => res.json())
      .then((data: CategoryTree[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      })

      newParams.delete('page')

      return newParams.toString()
    },
    [searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const queryString = createQueryString({ search: search || null })
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
  }

  const handleCategoryChange = (value: string) => {
    const queryString = createQueryString({ category: value === 'all' ? null : value || null })
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
  }

  const handlePriceChange = (minPrice: string, maxPrice: string) => {
    const queryString = createQueryString({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    })
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
    setIsMobileFiltersOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    router.push(pathname)
    setIsMobileFiltersOpen(false)
  }

  const hasActiveFilters = searchParams.toString() !== ''

  return (
    <div className="space-y-5 lg:sticky lg:top-24">
      <div className="space-y-4 lg:hidden">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-none pl-10"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-none px-4">
            Buscar
          </Button>
        </form>

        <div className="flex gap-2">
          <CategoryFilterMenu
            categories={categories}
            value={searchParams.get('category') || 'all'}
            onChange={handleCategoryChange}
          />

          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 rounded-none px-4">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>Ajuste a busca por categoria e faixa de preço.</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <CategoryFilterList
                  categories={categories}
                  currentValue={searchParams.get('category') || 'all'}
                  onSelect={handleCategoryChange}
                />
                <PriceFilter
                  minPrice={searchParams.get('minPrice') || ''}
                  maxPrice={searchParams.get('maxPrice') || ''}
                  onApply={handlePriceChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="border-r border-border pr-8">
          <div className="space-y-7">
            <DesktopFilterSection title="Buscar" defaultOpen>
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar produtos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 rounded-none pl-10"
                  />
                </div>
                <Button type="submit" variant="secondary" className="h-10 w-full rounded-none">
                  Aplicar busca
                </Button>
              </form>
            </DesktopFilterSection>

            <DesktopFilterSection title="Categorias" defaultOpen>
              <CategoryFilterList
                categories={categories}
                currentValue={searchParams.get('category') || 'all'}
                onSelect={handleCategoryChange}
              />
            </DesktopFilterSection>

            <DesktopFilterSection title="Preço" defaultOpen>
              <PriceFilter
                minPrice={searchParams.get('minPrice') || ''}
                maxPrice={searchParams.get('maxPrice') || ''}
                onApply={handlePriceChange}
                compact
              />
            </DesktopFilterSection>

            {hasActiveFilters && (
              <DesktopFilterSection title="Filtros ativos" defaultOpen>
                <div className="flex flex-wrap gap-2">
                  {searchParams.get('search') && (
                    <FilterTag
                      label={`Busca: ${searchParams.get('search')}`}
                      onRemove={() => {
                        setSearch('')
                        const queryString = createQueryString({ search: null })
                        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
                      }}
                    />
                  )}

                  {searchParams.get('category') && searchParams.get('category') !== 'all' && (
                    <FilterTag
                      label={
                        findCategoryName(categories, searchParams.get('category')!) ||
                        searchParams.get('category')!
                      }
                      onRemove={() => {
                        const queryString = createQueryString({ category: null })
                        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
                      }}
                    />
                  )}

                  {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
                    <FilterTag
                      label={`R$ ${searchParams.get('minPrice') || '0'} - R$ ${searchParams.get('maxPrice') || '∞'}`}
                      onRemove={() => {
                        const queryString = createQueryString({ minPrice: null, maxPrice: null })
                        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
                      }}
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 rounded-none px-0 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-transparent hover:text-foreground"
                  >
                    Limpar tudo
                  </Button>
                </div>
              </DesktopFilterSection>
            )}
          </div>
        </div>
      </aside>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {searchParams.get('search') && (
            <FilterTag
              label={`Busca: ${searchParams.get('search')}`}
              onRemove={() => {
                setSearch('')
                const queryString = createQueryString({ search: null })
                router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
              }}
            />
          )}

          {searchParams.get('category') && searchParams.get('category') !== 'all' && (
            <FilterTag
              label={findCategoryName(categories, searchParams.get('category')!) || searchParams.get('category')!}
              onRemove={() => {
                const queryString = createQueryString({ category: null })
                router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
              }}
            />
          )}

          {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
            <FilterTag
              label={`R$ ${searchParams.get('minPrice') || '0'} - R$ ${searchParams.get('maxPrice') || '∞'}`}
              onRemove={() => {
                const queryString = createQueryString({ minPrice: null, maxPrice: null })
                router.push(`${pathname}${queryString ? `?${queryString}` : ''}`)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function DesktopFilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-[0.95rem] font-medium text-foreground">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function CategoryFilterMenu({
  categories,
  value,
  onChange,
}: {
  categories: CategoryTree[]
  value: string
  onChange: (value: string) => void
}) {
  const isMobile = useIsMobile()
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const currentLabel =
    value === 'all' ? 'Categoria' : findCategoryName(categories, value) || 'Categoria'

  if (isMobile) {
    return (
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetTrigger asChild>
          <button type="button" className={CATEGORY_TRIGGER_CLASSNAME}>
            <span className="min-w-0 flex-1 truncate text-left">{currentLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Categoria</SheetTitle>
            <SheetDescription>Escolha uma categoria ou subcategoria para filtrar.</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <CategoryFilterList
              categories={categories}
              currentValue={value}
              onSelect={(nextValue) => {
                onChange(nextValue)
                setIsMobileSheetOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CATEGORY_TRIGGER_CLASSNAME}>
          <span className="min-w-0 flex-1 truncate text-left">{currentLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px] rounded-none border-border p-2">
        <DropdownMenuItem onSelect={() => onChange('all')} className="rounded-none">
          Todas as categorias
          {value === 'all' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DesktopCategoryMenuItem
            key={category.id}
            category={category}
            currentValue={value}
            onSelect={onChange}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DesktopCategoryMenuItem({
  category,
  currentValue,
  onSelect,
  ancestors = [],
}: {
  category: CategoryTree
  currentValue: string
  onSelect: (value: string) => void
  ancestors?: CategoryTree[]
}) {
  const path = [...ancestors, category]
  const value = buildCategoryValue(path)

  if (category.subcategories.length === 0) {
    return (
      <DropdownMenuItem onSelect={() => onSelect(value)} className="rounded-none">
        {category.name}
        {currentValue === value && <Check className="ml-auto h-4 w-4" />}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="rounded-none">{category.name}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="rounded-none border-border p-2">
        <DropdownMenuItem onSelect={() => onSelect(value)} className="rounded-none">
          Todos em {category.name}
          {currentValue === value && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        {category.subcategories.map((subcategory) => (
          <DesktopCategoryMenuItem
            key={subcategory.id}
            category={subcategory}
            currentValue={currentValue}
            onSelect={onSelect}
            ancestors={path}
          />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function CategoryFilterList({
  categories,
  currentValue,
  onSelect,
}: {
  categories: CategoryTree[]
  currentValue: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className="flex w-full items-center justify-between px-0 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>Todas as categorias</span>
        {currentValue === 'all' && <Check className="h-4 w-4" />}
      </button>
      {categories.map((category) => (
        <CategoryFilterTreeItem
          key={category.id}
          category={category}
          currentValue={currentValue}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function CategoryFilterTreeItem({
  category,
  currentValue,
  onSelect,
  ancestors = [],
}: {
  category: CategoryTree
  currentValue: string
  onSelect: (value: string) => void
  ancestors?: CategoryTree[]
}) {
  const path = [...ancestors, category]
  const value = buildCategoryValue(path)
  const hasChildren = category.subcategories.length > 0
  const isCurrentBranch = currentValue === value || currentValue.startsWith(`${value}/`)
  const indent = ancestors.length * 16

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onSelect(value)}
        className="flex w-full items-center justify-between py-2 text-left text-sm text-foreground transition-colors hover:text-accent"
        style={{ paddingLeft: indent }}
      >
        <span>{category.name}</span>
        {currentValue === value && <Check className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <Collapsible defaultOpen={isCurrentBranch}>
      <div style={{ paddingLeft: indent }}>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-foreground transition-colors hover:text-accent">
          <span>{category.name}</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect(value)}
          className="flex w-full items-center justify-between py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
          style={{ paddingLeft: indent + 16 }}
        >
          <span className="inline-flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5" />
            Todos em {category.name}
          </span>
          {currentValue === value && <Check className="h-4 w-4" />}
        </button>
        {category.subcategories.map((subcategory) => (
          <CategoryFilterTreeItem
            key={subcategory.id}
            category={subcategory}
            currentValue={currentValue}
            onSelect={onSelect}
            ancestors={path}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-sm text-foreground">
      {label}
      <button onClick={onRemove} className="text-muted-foreground transition-colors hover:text-accent">
        <X className="h-3 w-3" />
        <span className="sr-only">Remover filtro</span>
      </button>
    </span>
  )
}

function PriceFilter({
  minPrice,
  maxPrice,
  onApply,
  compact = false,
}: {
  minPrice: string
  maxPrice: string
  onApply: (min: string, max: string) => void
  compact?: boolean
}) {
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="space-y-2">
        <Label htmlFor="minPrice">Preço mínimo</Label>
        <Input
          id="minPrice"
          type="number"
          placeholder="R$ 0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="rounded-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPrice">Preço máximo</Label>
        <Input
          id="maxPrice"
          type="number"
          placeholder="R$ 500"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="rounded-none"
        />
      </div>
      <Button
        onClick={() => onApply(min, max)}
        className="h-10 w-full rounded-none"
        variant={compact ? 'outline' : 'default'}
      >
        Aplicar filtros
      </Button>
    </div>
  )
}
