import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCategoryTree } from '@/lib/api'
import type { CategoryTree } from '@/lib/types'

const categoryImages: Record<string, { image: string; description: string }> = {
  CONJUNTOS: {
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
    description: 'Looks coordenados para treinar com estilo',
  },
  TOPS: {
    image: 'https://images.unsplash.com/photo-1506629905607-d9b1c6d48c0b?w=900&q=80',
    description: 'Sustentação e liberdade em cada movimento',
  },
  LEGGINGS: {
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=900&q=80',
    description: 'Modelagem firme com conforto para o treino',
  },
  SHORTS: {
    image: 'https://images.unsplash.com/photo-1506321806993-0e39f08d61d0?w=900&q=80',
    description: 'Leveza e mobilidade para alta performance',
  },
  MACAQUINHOS: {
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80',
    description: 'Peças únicas com caimento marcante',
  },
  JAQUETAS: {
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=900&q=80',
    description: 'Camadas versáteis para antes e depois do treino',
  },
  CAMISETAS: {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80',
    description: 'Estilo e conforto no dia a dia',
  },
  CALCAS: {
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=900&q=80',
    description: 'Perfeitas para qualquer ocasião',
  },
  ROUPAS: {
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=900&q=80',
    description: 'Moda fitness para todos os momentos',
  },
}

const defaultImage = {
  image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80',
  description: 'Explore nossos produtos',
}

function normalizeCategoryKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

function getCategoryMeta(category: CategoryTree) {
  const normalizedKey = normalizeCategoryKey(
    category.slug || category.normalizedName || category.name
  )
  const nameKey = normalizeCategoryKey(category.name)

  const directMatch = categoryImages[normalizedKey] || categoryImages[nameKey]
  if (directMatch) return directMatch

  if (normalizedKey.includes('CONJUNTO')) return categoryImages.CONJUNTOS
  if (normalizedKey.includes('TOP')) return categoryImages.TOPS
  if (normalizedKey.includes('LEGGING')) return categoryImages.LEGGINGS
  if (normalizedKey.includes('SHORT')) return categoryImages.SHORTS
  if (normalizedKey.includes('MACAQUINHO')) return categoryImages.MACAQUINHOS
  if (normalizedKey.includes('JAQUETA')) return categoryImages.JAQUETAS

  return defaultImage
}

export async function CategoryGrid() {
  let categories: CategoryTree[] = []

  try {
    categories = await getCategoryTree()
  } catch {
    categories = []
  }

  return (
    <section className="bg-secondary/50 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm uppercase tracking-widest text-muted-foreground">Explore</p>
          <h2 className="text-3xl font-serif font-medium text-foreground md:text-4xl">
            Compre por categoria
          </h2>
        </div>

        <div
          className={`grid gap-6 ${
            categories.length >= 3
              ? 'md:grid-cols-3'
              : categories.length === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-1'
          }`}
        >
          {categories.map((category) => {
            const meta = getCategoryMeta(category)

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-lg"
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
                  <h3 className="mb-1 text-2xl font-serif font-medium">{category.name}</h3>
                  <p className="mb-2 text-sm text-background/80">{meta.description}</p>
                  {category.subcategories.length > 0 && (
                    <p className="mb-3 text-xs text-background/60">
                      {category.subcategories.map((subcategory) => subcategory.name).join(' · ')}
                    </p>
                  )}
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
