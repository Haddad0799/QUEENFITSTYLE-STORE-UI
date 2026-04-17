'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CategoryTree } from '@/lib/types'
import { cn } from '@/lib/utils'

export const launchesHref = '/lancamentos'
export type HeaderCatalogLoadState = 'loading' | 'ready' | 'unavailable'

export interface MegaMenuLink {
  label: string
  href: string
  description?: string
}

export const catalogOverviewLinks: MegaMenuLink[] = [
  {
    label: 'Ver todos os produtos',
    href: '/products',
    description: 'Acesse a vitrine completa com toda a coleção QueenFitStyle.',
  },
  {
    label: 'Nova coleção',
    href: launchesHref,
    description: 'Descubra os looks mais recentes com curadoria premium.',
  },
]

interface MegaMenuProps {
  categories: CategoryTree[]
  categoryLoadState: HeaderCatalogLoadState
  className?: string
  onNavigate?: () => void
}

export function MegaMenu({
  categories,
  categoryLoadState,
  className,
  onNavigate,
}: MegaMenuProps) {
  const contentColumns =
    categoryLoadState === 'ready' && categories.length > 0 ? categories : []

  return (
    <div
      className={cn(
        'rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_80px_rgba(15,15,15,0.08)]',
        className
      )}
    >
      <div
        className="grid gap-8 p-6 lg:gap-10 lg:p-8"
        style={{
          gridTemplateColumns:
            contentColumns.length > 0
              ? `minmax(0,0.9fr) repeat(${contentColumns.length}, minmax(0,1fr)) minmax(0,1.2fr)`
              : 'minmax(0,0.9fr) minmax(0,1.2fr)',
        }}
      >
        <MegaMenuColumn
          eyebrow="Navegação"
          title="Compre por ocasião"
          links={catalogOverviewLinks}
          onNavigate={onNavigate}
        />

        {categoryLoadState === 'loading' ? (
          <>
            <MegaMenuColumnSkeleton title="Categorias" />
            <MegaMenuColumnSkeleton title="Coleções" />
          </>
        ) : categoryLoadState === 'ready' && contentColumns.length > 0 ? (
          contentColumns.map((category) => (
            <MegaMenuColumn
              key={category.id}
              eyebrow="Catálogo"
              title={category.name}
              rootLink={{
                label: `Ver tudo em ${category.name}`,
                href: `/products?category=${category.slug}`,
                description:
                  typeof category.productCount === 'number'
                    ? `${category.productCount} produto${category.productCount === 1 ? '' : 's'} no grupo.`
                    : undefined,
              }}
              links={category.subcategories.map((subcategory) => ({
                label: subcategory.name,
                href: `/products?category=${subcategory.slug}`,
                description:
                  typeof subcategory.productCount === 'number'
                    ? `${subcategory.productCount} produto${subcategory.productCount === 1 ? '' : 's'} nesta seleção.`
                    : undefined,
              }))}
              onNavigate={onNavigate}
            />
          ))
        ) : (
          <MegaMenuUnavailable />
        )}

        <div className="relative min-h-[320px] overflow-hidden rounded-[1.75rem] bg-[#111111] text-white">
          <Image
            src="/placeholder.jpg"
            alt="Coleção QueenFitStyle"
            fill
            className="object-cover opacity-55"
            sizes="(max-width: 1024px) 100vw, 360px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.12)_0%,rgba(8,8,8,0.54)_45%,rgba(8,8,8,0.82)_100%)]" />

          <div className="relative flex h-full flex-col justify-between p-7">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/70">
                QueenFitStyle Edit
              </p>
              <h3 className="mt-4 max-w-xs font-serif text-[2rem] leading-none tracking-tight">
                Nova coleção 2026
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/78">
                Shapes sofisticados, tecidos de alta performance e uma leitura mais refinada
                da moda fitness feminina.
              </p>
            </div>

            <Button
              asChild
              className="h-11 w-fit rounded-full bg-white px-5 text-sm font-semibold text-[#111111] shadow-none transition-transform hover:translate-x-0.5 hover:bg-white/95"
            >
              <Link href={launchesHref} onClick={onNavigate}>
                Explorar coleção
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MegaMenuColumn({
  eyebrow,
  title,
  links,
  rootLink,
  onNavigate,
}: {
  eyebrow: string
  title: string
  links: MegaMenuLink[]
  rootLink?: MegaMenuLink
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="font-serif text-2xl leading-none tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      <div className="space-y-2">
        {rootLink ? (
          <Link
            href={rootLink.href}
            onClick={onNavigate}
            className="group flex rounded-2xl border border-black/6 bg-[#faf8f4] px-4 py-3 transition-all duration-200 hover:border-black/10 hover:bg-[#f6f1e8]"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
                {rootLink.label}
              </p>
              {rootLink.description ? (
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  {rootLink.description}
                </p>
              ) : null}
            </div>
          </Link>
        ) : null}

        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className="group flex rounded-2xl border border-transparent px-4 py-3 transition-all duration-200 hover:border-black/6 hover:bg-[#faf8f4]"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {link.label}
              </p>
              {link.description ? (
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  {link.description}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function MegaMenuColumnSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-[#eee7dc]" />
        <div className="h-8 w-36 animate-pulse rounded-full bg-[#f4efe7]" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((item) => (
          <div
            key={`${title}-${item}`}
            className="h-[72px] animate-pulse rounded-2xl bg-[#faf8f4]"
          />
        ))}
      </div>
    </div>
  )
}

function MegaMenuUnavailable() {
  return (
    <div className="flex items-start">
      <div className="rounded-[1.75rem] border border-black/6 bg-[#faf8f4] p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Catálogo
        </p>
        <h3 className="mt-3 font-serif text-2xl leading-none tracking-tight text-foreground">
          Categorias indisponíveis
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          O menu de categorias não carregou agora. Você ainda pode abrir a vitrine completa
          ou explorar os lançamentos.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/products"
            className="text-sm font-medium text-foreground transition-colors hover:text-accent"
          >
            Ver todos os produtos
          </Link>
          <Link
            href={launchesHref}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver lançamentos
          </Link>
        </div>
      </div>
    </div>
  )
}
