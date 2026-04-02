'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category } from '@/lib/types'

export function ProductFilters() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isOpen, setIsOpen] = useState(false)

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
      
      // Reset to first page when filters change
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
    setIsOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    router.push(pathname)
  }

  const hasActiveFilters = searchParams.toString() !== ''

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        {/* Category Select */}
        <Select
          value={searchParams.get('category') || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.normalizedName} value={category.normalizedName}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <PriceFilter
              minPrice={searchParams.get('minPrice') || ''}
              maxPrice={searchParams.get('maxPrice') || ''}
              onApply={handlePriceChange}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
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
              label={categories.find(c => c.normalizedName === searchParams.get('category'))?.name || searchParams.get('category')!}
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
            className="text-accent hover:text-accent/80"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
      {label}
      <button onClick={onRemove} className="hover:text-accent">
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
}: {
  minPrice: string
  maxPrice: string
  onApply: (min: string, max: string) => void
}) {
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="minPrice">Preço mínimo</Label>
        <Input
          id="minPrice"
          type="number"
          placeholder="R$ 0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
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
        />
      </div>
      <Button onClick={() => onApply(min, max)} className="w-full">
        Aplicar filtros
      </Button>
    </div>
  )
}
