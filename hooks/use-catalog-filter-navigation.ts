'use client'

import { startTransition, useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useNavigationLoading } from '@/components/navigation/navigation-loading-provider'
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
  const { beginNavigation } = useNavigationLoading()

  const currentFilters = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams]
  )
  const currentHref = useMemo(
    () => buildCatalogHref(pathname, currentFilters),
    [currentFilters, pathname]
  )

  const navigate = useCallback(
    (nextFilters: CatalogQueryFilters) => {
      const nextHref = buildCatalogHref(pathname, nextFilters)

      if (nextHref === currentHref) {
        return
      }

      beginNavigation()
      startTransition(() => {
        router.push(nextHref, { scroll: false })
      })
    },
    [beginNavigation, currentHref, pathname, router]
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
    if (pathname === currentHref) {
      return
    }

    beginNavigation()
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }, [beginNavigation, currentHref, pathname, router])

  return {
    currentFilters,
    updateFilters,
    setPage,
    clearAll,
  }
}
