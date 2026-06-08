'use client'

import { useCatalogRefresh } from '@/hooks/use-catalog-refresh'

/**
 * Monta uma única instância do polling de revalidação do catálogo. Renderizado
 * uma vez no layout raiz para evitar múltiplos intervalos simultâneos.
 */
export function CatalogRefresh() {
  useCatalogRefresh()
  return null
}
