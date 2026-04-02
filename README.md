# QueenFitStyle Store - Frontend

Frontend do e-commerce **QueenFitStyle**, uma loja virtual de roupas fitness femininas. Construído com **Next.js 15** (App Router) priorizando **SEO**, performance e experiência do consumidor.

## Arquitetura

Este frontend consome a API REST do backend **Java/Spring Boot** (módulo `catalog`), que disponibiliza os dados de produtos, SKUs e categorias. A comunicação segue o fluxo:

```
┌─────────────────────┐       REST        ┌──────────────────────────┐
│   Next.js (SSR)     │ ◄──────────────── │  Spring Boot (Catalog)   │
│   /store/products   │                   │  CatalogController       │
│   /store/categories │                   │  CatalogQueryService     │
└─────────┬───────────┘                   └──────────┬───────────────┘
          │                                          │
          │  POST /api/revalidate                    │  Webhook (on publish/update)
          │ ◄────────────────────────────────────────┘
          │  { tags: ["catalog-products", ...] }
          │
     revalidateTag() → cache invalidado instantaneamente
```

### Estratégia de Cache (ISR + On-Demand Revalidation)

Cada `fetch` no servidor combina **duas estratégias**:

| Estratégia | Finalidade |
|---|---|
| `tags` (on-demand) | O backend Java chama `POST /api/revalidate` com as tags afetadas → cache invalidado **instantaneamente** |
| `revalidate: 300` (fallback) | Rede de segurança — caso o webhook falhe, o cache expira sozinho em no máximo 5 minutos |

**Tags utilizadas:**

| Tag | Onde é usada |
|---|---|
| `catalog-products` | Listagem de produtos (`getProducts`) |
| `catalog-product-{slug}` | Detalhe do produto e SKUs (`getProductBySlug`, `getSkuDetail`) |
| `catalog-categories` | Listagem de categorias (`getCategories`) |

## Tecnologias

- **Next.js 15** — App Router, Server Components, SSR/ISR
- **React 19** — Suspense, Server/Client Components
- **TypeScript 5.7**
- **Tailwind CSS 4** — Estilização utility-first
- **Radix UI** — Componentes headless acessíveis (Dialog, Accordion, Select, Tabs, etc.)
- **Lucide React** — Ícones
- **Vercel Analytics** — Métricas de performance

## Estrutura do Projeto

```
app/
├── layout.tsx              # Layout raiz (Header, Footer, fontes, meta SEO global)
├── page.tsx                # Home (Hero, Produtos em destaque, Categorias, Newsletter)
├── products/
│   ├── page.tsx            # Listagem com filtros (categoria, cor, tamanho, preço)
│   └── [slug]/
│       ├── page.tsx        # Detalhe do produto (SSR + generateMetadata para SEO)
│       ├── product-detail-client.tsx  # Interações client-side (cor, tamanho, galeria)
│       └── not-found.tsx   # 404 customizado
├── api/
│   ├── categories/route.ts # Proxy de categorias
│   └── revalidate/route.ts # Webhook de revalidação on-demand
components/
├── home/                   # Hero banner, produtos em destaque, grid de categorias
├── layout/                 # Header e Footer
├── product/                # Cards, filtros, galeria de imagens, seletores
└── ui/                     # Componentes base (shadcn/ui + Radix)
lib/
├── api.ts                  # Funções de fetch (getProducts, getProductBySlug, etc.)
├── types.ts                # Interfaces TypeScript (Product, SKU, Category, Cart)
└── utils.ts                # Utilitários (cn, etc.)
```

## SEO

- **`generateMetadata`** dinâmico por produto (título, descrição, Open Graph com imagem)
- **Meta tags globais** no layout raiz (keywords, Open Graph, locale `pt_BR`)
- **SSR** — todo conteúdo é renderizado no servidor, indexável por crawlers
- **Semântica HTML** — `lang="pt-BR"`, fontes otimizadas (Inter + Playfair Display)
- **Viewport** configurado para mobile-first

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# URL da API backend (Java/Spring Boot)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Secret compartilhado com o backend para revalidação on-demand
REVALIDATE_SECRET=seu-secret-aqui
```

> O `REVALIDATE_SECRET` deve ser **idêntico** ao configurado no backend Java (`NextJsRevalidationAdapter`).

### Instalação e Execução

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm run start
```

## Backend (Visão Geral)

O backend é uma aplicação **Java/Spring Boot** modular com os seguintes módulos:

| Módulo | Responsabilidade |
|---|---|
| `catalog` | View materializada para a loja — produtos, SKUs, categorias, preços e estoque agregados. Dispara webhook de revalidação para o Next.js |
| `product` | CRUD de produtos e SKUs (backoffice) |
| `attribute` | Categorias, cores e tamanhos |
| `pricing` | Preços dos SKUs |
| `inventory` | Estoque e movimentações |
| `storage` | Upload de imagens (MinIO/S3) |
| `shared` | Configurações comuns, migrations Flyway, exceções base |

O módulo `catalog` escuta eventos de domínio (publicação, atualização, despublicação de produtos) via `CatalogEventListener` e sincroniza uma view desnormalizada. Após a sincronização, o `NextJsRevalidationAdapter` chama `POST /api/revalidate` no Next.js para invalidar o cache.
