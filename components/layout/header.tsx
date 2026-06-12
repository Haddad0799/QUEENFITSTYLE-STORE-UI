'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { startTransition, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  buildNavigationSignature,
  useNavigationLoading,
} from '@/components/navigation/navigation-loading-provider'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  catalogOverviewLinks,
  HeaderCatalogLoadState,
  launchesHref,
  MegaMenu,
} from '@/components/layout/mega-menu'
import { CartSheetContent } from '@/components/cart/cart-sheet'
import type { CategoryTree } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCart } from '@/src/hooks/useCart'

const CATALOG_CLOSE_DELAY_MS = 120

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { beginNavigation } = useNavigationLoading()
  const { totalItems, isHydrated, isCartOpen, setCartOpen } = useCart()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [catalogCategories, setCatalogCategories] = useState<CategoryTree[]>([])
  const [categoryLoadState, setCategoryLoadState] =
    useState<HeaderCatalogLoadState>('loading')
  const catalogAreaRef = useRef<HTMLDivElement>(null)
  const catalogCloseTimeoutRef = useRef<number | null>(null)
  const cartBadgeLabel = !isHydrated
    ? '0'
    : totalItems > 99
      ? '99+'
      : totalItems.toString()

  function clearCatalogCloseTimeout() {
    if (catalogCloseTimeoutRef.current !== null) {
      window.clearTimeout(catalogCloseTimeoutRef.current)
      catalogCloseTimeoutRef.current = null
    }
  }

  function openCatalogMenu() {
    clearCatalogCloseTimeout()
    setIsCatalogOpen(true)
  }

  function closeCatalogMenu() {
    clearCatalogCloseTimeout()
    setIsCatalogOpen(false)
  }

  function scheduleCatalogClose() {
    clearCatalogCloseTimeout()
    catalogCloseTimeoutRef.current = window.setTimeout(() => {
      setIsCatalogOpen(false)
      catalogCloseTimeoutRef.current = null
    }, CATALOG_CLOSE_DELAY_MS)
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = searchQuery.trim()

    if (!query) {
      return
    }

    setIsSearchOpen(false)
    setIsMobileMenuOpen(false)
    closeCatalogMenu()

    const nextHref = `/products?search=${encodeURIComponent(query)}`
    const currentHref = buildNavigationSignature(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    )

    if (nextHref === currentHref) {
      return
    }

    beginNavigation()
    startTransition(() => {
      router.push(nextHref)
    })
  }

  useEffect(() => {
    closeCatalogMenu()
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    fetch('/api/categories')
      .then((response) => response.json())
      .then((data: CategoryTree[]) => {
        if (data.length > 0) {
          setCatalogCategories(data)
          setCategoryLoadState('ready')
          return
        }

        setCatalogCategories([])
        setCategoryLoadState('unavailable')
      })
      .catch(() => {
        setCatalogCategories([])
        setCategoryLoadState('unavailable')
      })
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!catalogAreaRef.current?.contains(event.target as Node)) {
        closeCatalogMenu()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeCatalogMenu()
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(
    () => () => {
      clearCatalogCloseTimeout()
    },
    []
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="relative" ref={catalogAreaRef}>
        <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
          <div className="flex h-[74px] items-center justify-between gap-4 lg:h-[84px]">
            <div className="flex min-w-0 flex-1 items-center lg:gap-10">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full border border-transparent text-foreground hover:border-black/5 hover:bg-[#f6f3ee]"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[92vw] max-w-[420px] border-r border-border/70 px-0"
                >
                    <SheetHeader className="border-b border-border/70 px-6 pb-5 pt-6 text-left">
                    <SheetTitle className="text-xl tracking-[0.2em]">QUEENFITSTYLE</SheetTitle>
                    <SheetDescription>
                      Navegue pelo catálogo com uma estrutura mais clara e objetiva.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex h-full flex-col overflow-y-auto px-6 pb-8">
                    <form onSubmit={handleSearch} className="border-b border-border/70 py-5">
                      <div className="flex items-center gap-3 rounded-full border border-border/80 bg-[#fcfbf8] px-4">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Buscar por produto, modelagem ou coleção"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </form>

                    <nav className="py-4">
                      <Accordion type="multiple" className="border-b border-border/70">
                        <AccordionItem value="catalogo" className="border-b-0">
                          <AccordionTrigger className="py-5 text-base font-medium tracking-[0.08em] hover:no-underline">
                            Catálogo
                          </AccordionTrigger>
                          <AccordionContent className="space-y-5 pb-5">
                            <div className="space-y-2">
                              {catalogOverviewLinks.map((link) => (
                                <SheetClose asChild key={link.label}>
                                  <Link
                                    href={link.href}
                                    className="block rounded-2xl border border-transparent px-4 py-3 transition-colors hover:border-black/5 hover:bg-[#faf8f4]"
                                  >
                                    <p className="text-sm font-medium text-foreground">
                                      {link.label}
                                    </p>
                                    {link.description ? (
                                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {link.description}
                                      </p>
                                    ) : null}
                                  </Link>
                                </SheetClose>
                              ))}
                            </div>

                            {categoryLoadState === 'loading' ? (
                              <div className="space-y-2 rounded-[1.5rem] border border-border/70 p-4">
                                {[0, 1].map((item) => (
                                  <div
                                    key={item}
                                    className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]"
                                  />
                                ))}
                              </div>
                            ) : categoryLoadState === 'ready' &&
                              catalogCategories.length > 0 ? (
                              <Accordion
                                type="multiple"
                                className="rounded-[1.5rem] border border-border/70 px-4"
                              >
                                {catalogCategories.map((category) => (
                                  <AccordionItem
                                    key={category.id}
                                    value={category.slug}
                                    className="last:border-b-0"
                                  >
                                    <AccordionTrigger className="py-4 text-sm font-medium uppercase tracking-[0.14em] hover:no-underline">
                                      {category.name}
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-2 pb-4">
                                      <SheetClose asChild>
                                        <Link
                                          href={`/products?category=${category.slug}`}
                                          className="block rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#faf8f4]"
                                        >
                                          Ver tudo em {category.name}
                                        </Link>
                                      </SheetClose>
                                      {category.subcategories.map((subcategory) => (
                                        <SheetClose asChild key={subcategory.id}>
                                          <Link
                                            href={`/products?category=${subcategory.slug}`}
                                            className="block rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#faf8f4] hover:text-foreground"
                                          >
                                            {subcategory.name}
                                          </Link>
                                        </SheetClose>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <div className="rounded-[1.5rem] border border-border/70 bg-[#faf8f4] p-4">
                                <p className="text-sm font-medium text-foreground">
                                  Categorias indisponíveis no momento
                                </p>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                  O menu do catálogo não carregou agora. Você ainda pode abrir a
                                  vitrine completa.
                                </p>
                                <SheetClose asChild>
                                  <Link
                                    href="/products"
                                    className="mt-3 inline-flex text-sm font-medium text-foreground transition-colors hover:text-accent"
                                  >
                                    Ver todos os produtos
                                  </Link>
                                </SheetClose>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="space-y-1 py-4">
                        <SheetClose asChild>
                          <Link
                            href={launchesHref}
                            className={mobileNavLink(pathname === launchesHref)}
                          >
                            Lançamentos
                          </Link>
                        </SheetClose>

                        <SheetClose asChild>
                          <Link href="/" className={mobileNavLink(pathname === '/')}>
                            Home
                          </Link>
                        </SheetClose>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden lg:flex lg:items-center lg:gap-10">
                <Link
                  href="/"
                  className="group flex items-center gap-2.5"
                  onMouseEnter={closeCatalogMenu}
                  onFocus={closeCatalogMenu}
                >
                  <Image
                    src="/logo.png"
                    alt="QueenFitStyle"
                    width={48}
                    height={48}
                    priority
                    className="h-12 w-12 shrink-0 rounded-full object-contain transition-opacity group-hover:opacity-75"
                  />
                  <span className="text-xl font-semibold tracking-[0.32em] text-foreground transition-opacity group-hover:opacity-75">
                    QUEENFITSTYLE
                  </span>
                </Link>

                <nav className="flex items-center gap-8">
                  <button
                    type="button"
                    onClick={() => {
                      clearCatalogCloseTimeout()
                      setIsCatalogOpen((open) => !open)
                    }}
                    onMouseEnter={openCatalogMenu}
                    onMouseLeave={scheduleCatalogClose}
                    onFocus={openCatalogMenu}
                    onBlur={scheduleCatalogClose}
                    className={desktopNavClass(isCatalogOpen)}
                    aria-expanded={isCatalogOpen}
                    aria-controls="catalog-mega-menu"
                  >
                    Catálogo
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isCatalogOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  <Link
                    href={launchesHref}
                    className={desktopNavClass(pathname === launchesHref)}
                    onMouseEnter={closeCatalogMenu}
                    onFocus={closeCatalogMenu}
                  >
                    Lançamentos
                  </Link>
                </nav>
              </div>
            </div>

            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo.png"
                alt="QueenFitStyle"
                width={32}
                height={32}
                priority
                className="h-7 w-7 shrink-0 rounded-full object-contain"
              />
              <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
                QUEENFITSTYLE
              </span>
            </Link>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
              <IconButton
                label={isSearchOpen ? 'Fechar busca' : 'Abrir busca'}
                onClick={() => setIsSearchOpen((open) => !open)}
              >
                {isSearchOpen ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
              </IconButton>

              <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <IconButton label="Carrinho" className="relative">
                    <ShoppingBag className="h-4.5 w-4.5" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                      {cartBadgeLabel}
                    </span>
                  </IconButton>
                </SheetTrigger>
                <CartSheetContent />
              </Sheet>
            </div>
          </div>

          <div
            className={cn(
              'overflow-hidden border-t border-border/60 transition-[max-height,opacity] duration-300',
              isSearchOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-3 rounded-full border border-border/80 bg-[#fcfbf8] px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por leggings, tops, conjuntos ou coleção"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="h-12 rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                Buscar
              </Button>
            </form>
          </div>
        </div>

        <div
          id="catalog-mega-menu"
          className={cn(
            'pointer-events-none absolute inset-x-0 top-full hidden lg:block',
            isCatalogOpen && 'pointer-events-auto'
          )}
          onMouseEnter={openCatalogMenu}
          onMouseLeave={closeCatalogMenu}
        >
          <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
            <MegaMenu
              categories={catalogCategories}
              categoryLoadState={categoryLoadState}
              className={cn(
                'mt-4 origin-top transition-all duration-300',
                isCatalogOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              )}
              onNavigate={closeCatalogMenu}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function desktopNavClass(active: boolean) {
  return cn(
    'inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] transition-colors',
    active ? 'text-foreground' : 'text-foreground/66 hover:text-foreground'
  )
}

function mobileNavLink(active: boolean) {
  return cn(
    'block rounded-2xl px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] transition-colors',
    active ? 'bg-[#faf8f4] text-foreground' : 'text-foreground/72 hover:bg-[#faf8f4] hover:text-foreground'
  )
}

function IconButton({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode
  className?: string
  label: string
  onClick?: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      className={cn(
        'rounded-full border border-transparent text-foreground hover:border-black/5 hover:bg-[#f6f3ee] sm:size-9',
        className
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
