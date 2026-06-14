import { describe, expect, it } from 'vitest'
import { shouldReplaceSearchUrl } from './search-navigation'

describe('shouldReplaceSearchUrl', () => {
  // Regressão do bug: estando em /products?search=con, ao clicar num produto a
  // página voltava sozinha para /products?search=con. Ao abrir o detalhe, o
  // listener reseta o input para o termo da nova rota (sem ?search), mas o valor
  // debounced fica defasado. As camadas de blindagem garantem que NENHUM replace
  // de volta seja decidido durante essa troca de rota.
  describe('ao abrir um produto vindo de /products?search=con', () => {
    it('não decide replace quando a rota já é o detalhe e o input foi resetado', () => {
      // Ordem: listener rodou antes -> searchQuery e syncedSearch zerados, mas o
      // debounced ainda está defasado ("con").
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products/conjunto-vital',
          debouncedQuery: 'con',
          searchQuery: '',
          syncedSearch: '',
        })
      ).toBe(false)
    })

    it('não decide replace quando a rota já é o detalhe mesmo sem o input ter sido resetado ainda', () => {
      // Ordem inversa: efeito rodou antes do listener -> tudo ainda "con", mas a
      // rota já é o detalhe. A guarda de pathname (camada 2) cobre este caso.
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products/conjunto-vital',
          debouncedQuery: 'con',
          searchQuery: 'con',
          syncedSearch: 'con',
        })
      ).toBe(false)
    })

    it('não decide replace quando o debounced está defasado em relação ao input', () => {
      // Mesmo hipoteticamente na listagem, um debounced velho ("con") que não
      // corresponde ao input atual ("") é ignorado (camada 3).
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products',
          debouncedQuery: 'con',
          searchQuery: '',
          syncedSearch: '',
        })
      ).toBe(false)
    })
  })

  describe('busca ao vivo na listagem', () => {
    it('decide replace para um termo novo e estabilizado', () => {
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products',
          debouncedQuery: 'con',
          searchQuery: 'con',
          syncedSearch: '',
        })
      ).toBe(true)
    })

    it('não decide replace quando o termo já está refletido na URL', () => {
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products',
          debouncedQuery: 'con',
          searchQuery: 'con',
          syncedSearch: 'con',
        })
      ).toBe(false)
    })

    it('ignora espaços ao comparar com o termo já sincronizado', () => {
      expect(
        shouldReplaceSearchUrl({
          pathname: '/products',
          debouncedQuery: 'con ',
          searchQuery: 'con ',
          syncedSearch: 'con',
        })
      ).toBe(false)
    })
  })

  describe('fora da listagem', () => {
    it('não decide replace ao digitar em outra rota (ex.: home)', () => {
      expect(
        shouldReplaceSearchUrl({
          pathname: '/',
          debouncedQuery: 'con',
          searchQuery: 'con',
          syncedSearch: '',
        })
      ).toBe(false)
    })
  })
})
