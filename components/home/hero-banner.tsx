import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      <div className="container mx-auto px-4">
        <div className="grid min-h-[600px] items-center gap-8 lg:min-h-[700px] lg:grid-cols-2">
          <div className="z-10 space-y-6 py-16 lg:py-24">
            <p className="text-sm uppercase tracking-widest text-background/70">
              Nova Coleção 2026
            </p>
            <h1 className="text-4xl font-serif font-medium leading-tight text-balance md:text-5xl lg:text-6xl">
              Vista-se para o seu melhor desempenho
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-background/80">
              Roupas fitness femininas que combinam tecnologia, conforto e estilo para você
              alcançar seus objetivos.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/products">
                  Explorar Coleção
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="absolute inset-0 lg:relative lg:h-full">
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-foreground via-foreground/95 to-foreground/60 lg:from-transparent lg:via-transparent lg:to-transparent" />
            <div
              className="h-full w-full bg-[url('https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80')] bg-cover bg-center bg-no-repeat"
              role="img"
              aria-label="Mulher usando roupas fitness"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
