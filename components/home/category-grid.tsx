import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCategories } from '@/lib/api'
import type { Category } from '@/lib/types'

const categoryImages: Record<string, { image: string; description: string }> = {
  Camisetas: {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    description: 'Estilo e conforto no dia a dia',
  },
  Calças: {
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80',
    description: 'Perfeitas para qualquer ocasião',
  },
  Tops: {
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
    description: 'Suporte e liberdade de movimento',
  },
  Leggings: {
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
    description: 'Conforto e estilo para seus treinos',
  },
}

const defaultImage = {
  image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80',
  description: 'Explore nossos produtos',
}

export async function CategoryGrid() {
  let categories: Category[] = []
  try {
    categories = await getCategories()
  } catch {
    categories = []
  }
  return (
    <section className="py-16 lg:py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
            Explore
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground">
            Compre por Categoria
          </h2>
        </div>

        {/* Categories */}
        <div className={`grid gap-6 ${categories.length >= 3 ? 'md:grid-cols-3' : categories.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          {categories.map((category) => {
            const meta = categoryImages[category.name] || defaultImage
            return (
              <Link
                key={category.normalizedName}
                href={`/products?category=${category.normalizedName}`}
                className="group relative overflow-hidden rounded-lg aspect-[4/5]"
              >
                <Image
                  src={meta.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                  <h3 className="text-2xl font-serif font-medium mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-background/80 mb-4">
                    {meta.description}
                  </p>
                  <span className="inline-flex items-center text-sm font-medium group-hover:underline">
                    Explorar
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
