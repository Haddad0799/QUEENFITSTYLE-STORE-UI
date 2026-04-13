'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { buildCategoryValue } from '@/lib/category-tree'
import type { CategoryTree } from '@/lib/types'

const staticLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/products', label: 'Todos os Produtos' },
]

function splitIntoBalancedColumns(items: CategoryTree[]) {
  if (items.length === 0) return []

  const columnCount =
    items.length <= 4 ? 1 :
    items.length <= 8 ? 2 :
    items.length <= 12 ? 3 : 4

  const perColumn = Math.ceil(items.length / columnCount)
  const columns: CategoryTree[][] = []

  for (let index = 0; index < items.length; index += perColumn) {
    columns.push(items.slice(index, index + perColumn))
  }

  return columns
}

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<CategoryTree[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/categories?tree=true')
      .then((res) => res.json())
      .then((data: CategoryTree[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const navigationCategories = categories.filter((category) => category.subcategories.length > 0)
  const activeCategory =
    navigationCategories.find((category) => category.id === activeCategoryId) ?? null
  const activeColumns = useMemo(
    () => splitIntoBalancedColumns(activeCategory?.subcategories ?? []),
    [activeCategory]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      onMouseLeave={() => setActiveCategoryId(null)}
    >
      <div className="relative mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de navegacao</SheetTitle>
                <SheetDescription>Links de navegacao do site</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {staticLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="py-1 text-lg font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
                {navigationCategories.map((category) => (
                  <MobileCategoryItem key={category.id} category={category} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <nav className="hidden min-w-0 flex-1 items-center gap-6 lg:flex">
            {staticLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {navigationCategories.map((category) => (
              <DesktopCategoryItem
                key={category.id}
                category={category}
                isActive={activeCategoryId === category.id}
                onOpen={() => setActiveCategoryId(category.id)}
              />
            ))}
          </nav>

          <Link href="/" className="flex items-center justify-center px-4 text-center">
            <span className="text-xl font-bold tracking-[0.28em] text-foreground">
              QUEEN<span className="text-accent">FITSTYLE</span>
            </span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-[150px] rounded-none sm:w-[220px]"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="h-5 w-5" />
              <span className="sr-only">Conta</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="sr-only">Carrinho</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                0
              </span>
            </Button>
          </div>
        </div>

        {activeCategory && (
          <div className="absolute inset-x-0 top-full hidden border-t border-border bg-background/98 shadow-[0_24px_50px_rgba(0,0,0,0.06)] lg:block">
            <div className="px-4 py-6 xl:px-6">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {activeCategory.name}
                </p>
                <Link
                  href={`/products?category=${buildCategoryValue([activeCategory])}`}
                  className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:text-accent"
                >
                  Ver tudo
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className={`grid gap-x-8 gap-y-2 ${
                activeColumns.length === 1 ? 'grid-cols-1' :
                activeColumns.length === 2 ? 'grid-cols-2' :
                activeColumns.length === 3 ? 'grid-cols-3' :
                'grid-cols-4'
              }`}>
                {activeColumns.map((column, index) => (
                  <div key={index} className="space-y-2">
                    {column.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/products?category=${buildCategoryValue([activeCategory, subcategory])}`}
                        className="block text-[15px] font-medium leading-snug text-foreground transition-colors hover:text-accent"
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function DesktopCategoryItem({
  category,
  isActive,
  onOpen,
}: {
  category: CategoryTree
  isActive: boolean
  onOpen: () => void
}) {
  return (
    <div onMouseEnter={onOpen} onFocus={onOpen}>
      <Link
        href={`/products?category=${buildCategoryValue([category])}`}
        className={`inline-flex items-center gap-1 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
          isActive ? 'text-foreground' : 'text-foreground/80 hover:text-foreground'
        }`}
      >
        {category.name}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isActive ? 'rotate-180' : ''}`} />
      </Link>
    </div>
  )
}

function MobileCategoryItem({ category }: { category: CategoryTree }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-lg font-medium text-foreground transition-colors hover:text-accent">
        {category.name}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 flex flex-col gap-1 pl-4">
        <Link
          href={`/products?category=${buildCategoryValue([category])}`}
          className="flex items-center gap-2 py-1 text-base text-muted-foreground transition-colors hover:text-accent"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Todos em {category.name}
        </Link>
        {category.subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/products?category=${buildCategoryValue([category, subcategory])}`}
            className="flex items-center gap-2 py-1 text-base text-muted-foreground transition-colors hover:text-accent"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            {subcategory.name}
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
