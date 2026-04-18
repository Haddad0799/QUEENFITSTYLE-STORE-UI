'use client'

import type { ReactNode } from 'react'
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const SHOW_DELAY_MS = 400
const MIN_VISIBLE_MS = 280
const FAILSAFE_MS = 12000

interface NavigationLoadingContextValue {
  beginNavigation: () => void
  isNavigationLoading: boolean
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null)

function toQueryString(searchParams?: { toString(): string } | null) {
  const queryString = searchParams?.toString()
  return queryString ? `?${queryString}` : ''
}

export function buildNavigationSignature(
  pathname: string | null,
  searchParams?: { toString(): string } | null
) {
  return `${pathname ?? '/'}${toQueryString(searchParams)}`
}

function shouldTrackAnchorNavigation(anchor: HTMLAnchorElement) {
  if (!anchor.href || anchor.dataset.navigationLoading === 'false') {
    return false
  }

  if (
    anchor.target === '_blank' ||
    anchor.hasAttribute('download') ||
    anchor.getAttribute('rel') === 'external' ||
    anchor.getAttribute('aria-disabled') === 'true'
  ) {
    return false
  }

  const url = new URL(anchor.href, window.location.href)

  if (url.origin !== window.location.origin) {
    return false
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false
  }

  return true
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const [isNavigationLoading, setIsNavigationLoading] = useState(false)
  const previousRouteSignatureRef = useRef<string | null>(null)
  const isNavigationPendingRef = useRef(false)
  const overlayVisibleAtRef = useRef<number | null>(null)
  const showTimeoutRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const failsafeTimeoutRef = useRef<number | null>(null)

  const clearShowTimeout = useCallback(() => {
    if (showTimeoutRef.current !== null) {
      window.clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
  }, [])

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const clearFailsafeTimeout = useCallback(() => {
    if (failsafeTimeoutRef.current !== null) {
      window.clearTimeout(failsafeTimeoutRef.current)
      failsafeTimeoutRef.current = null
    }
  }, [])

  const hideLoading = useCallback(() => {
    clearShowTimeout()
    clearHideTimeout()
    clearFailsafeTimeout()
    isNavigationPendingRef.current = false
    overlayVisibleAtRef.current = null
    setIsNavigationLoading(false)
  }, [clearFailsafeTimeout, clearHideTimeout, clearShowTimeout])

  const finishNavigation = useCallback(() => {
    clearShowTimeout()
    clearFailsafeTimeout()
    isNavigationPendingRef.current = false

    if (!isNavigationLoading) {
      hideLoading()
      return
    }

    clearHideTimeout()
    const elapsedVisible =
      overlayVisibleAtRef.current === null ? 0 : Date.now() - overlayVisibleAtRef.current
    const remaining = Math.max(MIN_VISIBLE_MS - elapsedVisible, 0)

    hideTimeoutRef.current = window.setTimeout(() => {
      hideLoading()
    }, remaining)
  }, [clearFailsafeTimeout, clearHideTimeout, clearShowTimeout, hideLoading, isNavigationLoading])

  const beginNavigation = useCallback(() => {
    isNavigationPendingRef.current = true
    clearShowTimeout()
    clearHideTimeout()
    clearFailsafeTimeout()

    // Delay the overlay so hot-cache navigations still feel immediate.
    if (!isNavigationLoading) {
      showTimeoutRef.current = window.setTimeout(() => {
        if (!isNavigationPendingRef.current) {
          return
        }

        overlayVisibleAtRef.current = Date.now()
        setIsNavigationLoading(true)
      }, SHOW_DELAY_MS)
    }

    failsafeTimeoutRef.current = window.setTimeout(() => {
      hideLoading()
    }, FAILSAFE_MS)
  }, [clearFailsafeTimeout, clearHideTimeout, clearShowTimeout, hideLoading, isNavigationLoading])

  const handleRouteChange = useCallback(
    (routeSignature: string) => {
      if (previousRouteSignatureRef.current === routeSignature) {
        return
      }

      previousRouteSignatureRef.current = routeSignature
      finishNavigation()
    },
    [finishNavigation]
  )

  useEffect(() => {
    if (previousRouteSignatureRef.current !== null) {
      return
    }

    previousRouteSignatureRef.current = buildNavigationSignature(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    )
  }, [])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || !shouldTrackAnchorNavigation(anchor)) {
        return
      }

      beginNavigation()
    }

    const handlePopState = () => {
      beginNavigation()
    }

    document.addEventListener('click', handleDocumentClick, true)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [beginNavigation])

  useEffect(
    () => () => {
      clearShowTimeout()
      clearHideTimeout()
      clearFailsafeTimeout()
    },
    [clearFailsafeTimeout, clearHideTimeout, clearShowTimeout]
  )

  const contextValue = useMemo(
    () => ({
      beginNavigation,
      isNavigationLoading,
    }),
    [beginNavigation, isNavigationLoading]
  )

  return (
    <NavigationLoadingContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <NavigationLocationListener onRouteChange={handleRouteChange} />
      </Suspense>

      <div className="relative">
        <div
          className={cn(
            'transition-[opacity,filter] duration-200',
            isNavigationLoading && 'opacity-60 blur-[2px]'
          )}
        >
          {children}
        </div>

        <div
          aria-hidden={!isNavigationLoading}
          className={cn(
            'fixed inset-0 z-[80] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[3px] transition-opacity duration-200',
            isNavigationLoading ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          )}
        >
          <div className="flex min-w-[220px] items-center gap-4 rounded-[1.75rem] border border-border/80 bg-card/92 px-6 py-5 shadow-[0_24px_70px_rgba(15,15,15,0.16)]">
            <span className="flex size-11 items-center justify-center rounded-full bg-foreground text-background">
              <Spinner className="size-5" aria-hidden="true" />
            </span>

            <div role="status" aria-live="polite" className="space-y-1">
              <p className="text-sm font-semibold tracking-[0.14em] text-foreground uppercase">
                Carregando
              </p>
              <p className="text-sm text-muted-foreground">Aguarde um instante...</p>
            </div>
          </div>
        </div>
      </div>
    </NavigationLoadingContext.Provider>
  )
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext)

  if (!context) {
    throw new Error('useNavigationLoading must be used within NavigationLoadingProvider')
  }

  return context
}

function NavigationLocationListener({
  onRouteChange,
}: {
  onRouteChange: (routeSignature: string) => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeSignature = useMemo(
    () => buildNavigationSignature(pathname, searchParams),
    [pathname, searchParams]
  )

  useEffect(() => {
    onRouteChange(routeSignature)
  }, [onRouteChange, routeSignature])

  return null
}
