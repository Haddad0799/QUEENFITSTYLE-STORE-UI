import Link from 'next/link'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/api'
import { ProductGrid } from '@/components/product/product-grid'
import { Button } from '@/components/ui/button'
import type { ProductListItem } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Lançamentos',
  description:
    'Descubra os lançamentos QueenFitStyle com curadoria de peças femininas fitness em destaque.',
}

export default async function LaunchesPage() {
  let products: ProductListItem[] = []
  let hasError = false

  try {
    const response = await getProducts({
      isLaunch: true,
      pageSize: 24,
    })

    const hasExplicitLaunchFlags = response.content.some(
      (product) => typeof product.isLaunch === 'boolean'
    )

    const launches = hasExplicitLaunchFlags
      ? response.content.filter((product) => product.isLaunch)
      : response.content

    products = launches.map((product) => ({
      ...product,
      isLaunch: true,
      launchLabel: product.launchLabel ?? 'LANÇAMENTO',
    }))
  } catch {
    hasError = true
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6 lg:py-10">
      <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,#fbfaf7_0%,#f4efe8_100%)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
        <p className="text-xs font-medium uppercase tracking-[0.34em] text-muted-foreground">
          QueenFitStyle
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl leading-none tracking-tight text-foreground sm:text-5xl">
              Lançamentos
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Uma seleção dedicada às novidades da temporada, com modelagens mais refinadas,
              performance elevada e acabamento premium.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-black/10 bg-white/80 px-5 hover:bg-white"
          >
            <Link href="/products">Ver catálogo completo</Link>
          </Button>
        </div>
      </section>

      <section className="pt-8 lg:pt-10">
        {hasError ? (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
            <p className="text-lg font-medium text-foreground">
              Não foi possível carregar os lançamentos agora.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente novamente em instantes ou continue navegando pelo catálogo completo.
            </p>
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
            <p className="text-lg font-medium text-foreground">
              Ainda não há produtos marcados como lançamento.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que a flag <code>isLaunch</code> estiver ativa na API, esta página passa a
              destacar automaticamente as novidades.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
