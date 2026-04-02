# 👑 QueenFitStyle — Store UI

Frontend do e-commerce **QueenFitStyle**, uma loja de roupas fitness femininas construída com **Next.js 15** e focada em **SEO**, **performance** e **experiência do usuário**.

> 🔗 Este projeto consome a API REST do repositório [QUEENFITSTYLE-ERO-STORE-BACKEND](https://github.com/Haddad0799/QUEENFITSTYLE-ERO-STORE-BACKEND).

---

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Destaques Técnicos](#-destaques-técnicos)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar](#-como-executar)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🧭 Visão Geral

A **QueenFitStyle Store UI** é a interface de uma loja virtual de roupas fitness femininas. O projeto foi construído com Next.js utilizando o **App Router** e **React Server Components**, priorizando renderização no servidor para otimização de SEO e velocidade de carregamento.

### Funcionalidades

- 🏠 **Home page** com hero banner, produtos em destaque e grade de categorias
- 🛍️ **Catálogo de produtos** com filtros por categoria, busca por texto e faixa de preço
- 📄 **Página de detalhe do produto** com galeria de imagens, seletor de cor/tamanho e controle de estoque
- 🔍 **Busca de produtos** integrada no header e na página de catálogo
- 📱 **Design responsivo** com menu mobile via Sheet (side drawer)
- 📊 **Paginação** server-side para listagem de produtos
- 📧 **Newsletter** para captação de leads

---

## ⚡ Destaques Técnicos

### 1. Server Components & SEO

O projeto utiliza **React Server Components (RSC)** como padrão. As páginas de listagem e detalhe do produto são renderizadas inteiramente no servidor, garantindo que o conteúdo esteja disponível no HTML inicial — essencial para indexação por mecanismos de busca.

- O **layout raiz** (`app/layout.tsx`) define metadados globais de SEO com `title`, `description`, `keywords`, e `openGraph` configurados para o locale `pt_BR`.
- A **página de detalhe do produto** (`app/products/[slug]/page.tsx`) utiliza `generateMetadata` para gerar **meta tags dinâmicas** por produto, incluindo Open Graph com imagem — fundamental para compartilhamento em redes sociais.
- O atributo `lang="pt-BR"` está definido na tag `<html>`, garantindo correta interpretação do idioma por crawlers.

### 2. Estratégia de Cache e Revalidação (ISR)

As chamadas à API utilizam a opção `next: { tags: [...], revalidate: 300 }` do `fetch`, implementando **Incremental Static Regeneration (ISR)**:

- As páginas são cacheadas por **5 minutos** (300s), reduzindo chamadas ao backend.
- Uma **API Route de revalidação on-demand** (`app/api/revalidate/route.ts`) permite que o backend invalide o cache via webhook com tags específicas (ex: `catalog-products`, `catalog-product-{slug}`), protegida por um secret.
- Isso garante que o catálogo esteja sempre atualizado sem sacrificar performance.

### 3. Separação Client/Server Components

O projeto aplica uma **separação clara** entre componentes servidor e cliente:

- **Server Components** (padrão): `FeaturedProducts`, `ProductDetail`, `ProductList` — fazem fetch de dados diretamente no servidor.
- **Client Components** (`'use client'`): `ProductDetailClient`, `Header`, `ProductFilters` — gerenciam estado interativo (seleção de cor/tamanho, busca, filtros).

Essa separação minimiza o JavaScript enviado ao cliente, melhorando performance e Core Web Vitals.

### 4. Streaming com Suspense

Todas as áreas com data fetching assíncrono são envolvidas em `<Suspense>` com fallbacks de **skeleton loading**, habilitando **streaming de HTML**. Isso permite que o shell da página seja exibido instantaneamente enquanto os dados são carregados no servidor.

### 5. Rotas Dinâmicas com Slug

A rota `app/products/[slug]/page.tsx` utiliza **rotas dinâmicas** baseadas em slug para páginas de produto, gerando URLs amigáveis para SEO como `/products/legging-premium-preta`.

### 6. API Proxy para Categorias

Uma **Route Handler** (`app/api/categories/route.ts`) atua como proxy BFF (Backend for Frontend), expondo categorias para componentes client-side sem expor a URL do backend diretamente ao navegador.

### 7. Sistema de Design com shadcn/ui

O projeto utiliza **shadcn/ui** (estilo `new-york`) com **Radix UI** primitives e **Tailwind CSS v4**, oferecendo:

- Componentes acessíveis e customizáveis (Dialog, Sheet, Select, Tabs, Toast, etc.)
- Consistência visual em toda a aplicação
- Ícones via **Lucide React**

### 8. Tipagem Forte

Todos os modelos de dados da API estão tipados em `lib/types.ts`, incluindo: `ProductListItem`, `ProductDetail`, `ProductColor`, `ProductSku`, `Category`, `ProductFilters`, e preparação para `Cart`/`CartItem`.

### 9. Otimização de Fontes

Utiliza `next/font/google` para carregar **Inter** (corpo) e **Playfair Display** (títulos serif) com subset `latin`, eliminando layout shift causado por fontes externas.

### 10. Analytics

Integração com **Vercel Analytics** (`@vercel/analytics`) para monitoramento de métricas de performance e uso em produção.

---

## 🛠️ Tecnologias

| Tecnologia | Função |
|---|---|
| **Next.js 15** | Framework React com App Router, SSR, ISR e Server Components |
| **React 19** | Biblioteca de UI com suporte a Server Components |
| **TypeScript** | Tipagem estática e segurança de tipos |
| **Tailwind CSS v4** | Estilização utility-first |
| **shadcn/ui** | Componentes acessíveis baseados em Radix UI |
| **Radix UI** | Primitivas de UI headless e acessíveis |
| **Lucide React** | Biblioteca de ícones |
| **Zod** | Validação de schemas (preparado para formulários) |
| **React Hook Form** | Gerenciamento de formulários |
| **Embla Carousel** | Carousel de imagens |
| **Vercel Analytics** | Monitoramento de performance |

---

## 📁 Estrutura do Projeto

```
├── app/
│   ├── layout.tsx              # Layout raiz com metadados SEO globais
│   ├── page.tsx                # Home page
│   ├── globals.css             # Estilos globais Tailwind
│   ├── api/
│   │   ├── categories/route.ts # Proxy BFF para categorias
│   │   └── revalidate/route.ts # Endpoint de revalidação on-demand
│   └── products/
│       ├── page.tsx            # Catálogo com filtros e paginação
│       └── [slug]/
│           ├── page.tsx        # Detalhe do produto (SSR + SEO dinâmico)
│           ├── product-detail-client.tsx  # Interatividade client-side
│           └── not-found.tsx   # Página 404 customizada para produto
├── components/
│   ├── home/                   # Componentes da home (hero, featured, categories, newsletter)
│   ├── layout/                 # Header e Footer
│   ├── product/                # Cards, filtros, galeria, seletores, skeletons, paginação
│   └── ui/                     # Componentes shadcn/ui
├── lib/
│   ├── api.ts                  # Funções de fetch para a API do backend
│   ├── types.ts                # Tipos TypeScript dos modelos de dados
│   └── utils.ts                # Utilitários (cn helper do shadcn)
├── hooks/                      # Custom hooks (toast, mobile detection)
└── public/                     # Assets estáticos (ícones, placeholders)
```

---

## 🚀 Como Executar

### Pré-requisitos

- **Node.js** 18+
- **npm** (ou outro gerenciador de pacotes)
- Backend [QUEENFITSTYLE-ERO-STORE-BACKEND](https://github.com/Haddad0799/QUEENFITSTYLE-ERO-STORE-BACKEND) rodando na porta 8080

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/Haddad0799/QUEENFITSTYLE-STORE-UI.git
cd QUEENFITSTYLE-STORE-UI

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env .env.local
# Edite .env.local com suas configurações

# Iniciar em modo de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API do backend | `http://localhost:8080` |
| `REVALIDATE_SECRET` | Secret para autenticação do endpoint de revalidação on-demand | — |

---

## 📜 Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera o build de produção
npm run start    # Inicia o servidor de produção
npm run lint     # Executa o ESLint
```

---

## 🏗️ Arquitetura de Comunicação

```
┌──────────────┐       fetch (SSR)        ┌───────────────────────┐
│              │ ──────────────────────▶   │                       │
│  Next.js UI  │                           │  Spring Boot Backend  │
│  (Frontend)  │ ◀──────────────────────   │  (API REST)           │
│              │       JSON response       │                       │
└──────┬───────┘                           └───────────┬───────────┘
       │                                               │
       │  POST /api/revalidate                         │  Webhook
       │ ◀─────────────────────────────────────────────┘
       │  (invalida cache por tags)
       │
       ▼
  Browser (HTML pré-renderizado + hidratação parcial)
```

---

<p align="center">
  Feito com 💜 por <strong>QueenFitStyle</strong>
</p>
