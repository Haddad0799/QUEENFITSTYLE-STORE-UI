'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  buildCatalogQueryString,
  mergeCatalogQueryFilters,
  parseCatalogSearchParams,
} from '@/lib/catalog-query'
import type { CatalogQueryFilters } from '@/lib/types'

type CatalogFilterPatch = {
  [Key in keyof CatalogQueryFilters]?: CatalogQueryFilters[Key] | null
}

function buildCatalogHref(pathname: string, filters: CatalogQueryFilters) {
  const queryString = buildCatalogQueryString(filters)
  return queryString ? `${pathname}?${queryString}` : pathname
}

export function useCatalogFilterNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentFilters = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams]
  )

  const navigate = useCallback(
    (nextFilters: CatalogQueryFilters) => {
      router.push(buildCatalogHref(pathname, nextFilters), { scroll: false })
    },
    [pathname, router]
  )

  const updateFilters = useCallback(
    (patch: CatalogFilterPatch, options?: { resetPage?: boolean }) => {
      navigate(
        mergeCatalogQueryFilters(currentFilters, patch, {
          resetPage: options?.resetPage ?? true,
        })
      )
    },
    [currentFilters, navigate]
  )

  const setPage = useCallback(
    (page: number) => {
      updateFilters({ page }, { resetPage: false })
    },
    [updateFilters]
  )

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  return {
    currentFilters,
    updateFilters,
    setPage,
    clearAll,
  }
}
