import Link from 'next/link'
import { ArrowRight, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function CatalogEmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <Empty className="min-h-[420px] rounded-[2rem] border border-black/6 bg-[linear-gradient(135deg,#fbfaf7_0%,#f3ede5_100%)] p-8 md:p-12">
      <EmptyHeader className="max-w-lg">
        <EmptyMedia variant="icon" className="mb-4 size-14 rounded-full bg-white shadow-[0_10px_24px_rgba(15,15,15,0.06)]">
          <SlidersHorizontal className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="font-serif text-[2rem] leading-none tracking-tight text-foreground md:text-[2.4rem]">
          Nenhum produto encontrado
        </EmptyTitle>
        <EmptyDescription className="max-w-md text-sm leading-7 text-muted-foreground md:text-base">
          Ajuste os filtros para ampliar a vitrine ou volte para a coleção completa e explore
          a curadoria QueenFitStyle com mais liberdade.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent className="max-w-none">
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {hasActiveFilters ? (
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-black/10 bg-white/90 px-5 hover:bg-white"
            >
              <Link href="/products">Limpar filtros</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-11 rounded-full border-black/10 bg-white/70 px-5"
            >
              Limpar filtros
            </Button>
          )}

          <Button
            asChild
            className="h-11 rounded-full bg-foreground px-5 text-background hover:bg-foreground/90"
          >
            <Link href="/products">
              Ver todos os produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}
