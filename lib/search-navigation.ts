/** Rota da listagem de produtos — única onde a busca ao vivo atualiza a URL. */
export const PRODUCTS_PATH = '/products'

interface SearchReplaceDecision {
  /** Rota atual (usePathname). */
  pathname: string
  /** Termo já estabilizado pelo debounce. */
  debouncedQuery: string
  /** Termo atual no campo de busca. */
  searchQuery: string
  /** Termo de busca já refletido na URL (ref de sincronização). */
  syncedSearch: string
}

/**
 * Decide se a busca ao vivo deve disparar um router.replace para atualizar a URL.
 *
 * Blindagem em camadas contra o bug de redirect de volta a /products ao abrir um
 * produto (qualquer ordem de execução dos efeitos é coberta):
 *
 * 1. (timing) Só atualiza a URL quando a rota atual É a listagem. Se o efeito
 *    rodar já em outra rota (ex.: indo para /products/{slug}), não navega.
 * 2. (valor) Só age sobre um termo estabilizado que ainda corresponde ao campo;
 *    um debounce defasado durante a troca de rota é ignorado.
 * 3. (no-op) Não navega se o termo já é o que está na URL.
 */
export function shouldReplaceSearchUrl({
  pathname,
  debouncedQuery,
  searchQuery,
  syncedSearch,
}: SearchReplaceDecision): boolean {
  // Camada 2: só na listagem.
  if (pathname !== PRODUCTS_PATH) {
    return false
  }

  // Camada 3: o termo estabilizado precisa corresponder ao input atual.
  if (debouncedQuery !== searchQuery) {
    return false
  }

  // Já refletido na URL — nada a fazer.
  if (debouncedQuery.trim() === syncedSearch.trim()) {
    return false
  }

  return true
}
