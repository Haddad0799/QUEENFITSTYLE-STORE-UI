# Queenfitstyle Store

Loja virtual do ecossistema Queenfitstyle, desenvolvida para exibir produtos de forma rápida, indexável e sempre atualizada.

Construída com Next.js 15, a aplicação prioriza SEO, performance e sincronização em tempo real com o backend.

---

## Problema

Em e-commerces tradicionais, a vitrine apresenta desafios como:

- Páginas lentas devido a consultas complexas no backend
- Conteúdo desatualizado após mudanças no catálogo
- Dependência de rebuild completo para refletir alterações
- Baixa indexação em buscadores quando mal configurado

---

## Solução

A loja foi projetada para:

- Renderizar páginas no servidor (SSR) garantindo indexação por buscadores
- Utilizar cache inteligente (ISR) para alta performance
- Receber atualizações do backend automaticamente via webhook
- Revalidar apenas os conteúdos afetados, sem rebuild completo

---

## Resultado

- Páginas rápidas e otimizadas para SEO
- Atualização quase em tempo real após mudanças no ERP
- Redução de carga no backend
- Melhor experiência para o usuário final

---

## Arquitetura (Visão Geral)

Fluxo de dados:

1. O frontend busca dados do backend (Spring Boot - módulo catalog)
2. As páginas são renderizadas no servidor (SSR)
3. O conteúdo é armazenado em cache (ISR)
4. Quando um produto é alterado:
   - O backend envia um webhook
   - O frontend invalida o cache via tags
   - Apenas as páginas afetadas são atualizadas

---

## Integração com Backend

Este frontend consome a API REST do módulo de catálogo.

Responsabilidades do backend:

- Fornecer dados de produtos, SKUs e categorias
- Publicar eventos após alterações
- Notificar o frontend para revalidação de cache

---

## Estratégia de Cache

A aplicação combina duas estratégias:

### Revalidação sob demanda (principal)

- O backend chama o endpoint `/api/revalidate`
- O cache é invalidado imediatamente com base em tags

Tags utilizadas:

- catalog-products (listagem)
- catalog-product-{slug} (detalhe)
- catalog-categories (categorias)

### Revalidação automática (fallback)

- Tempo de expiração: 300 segundos
- Garante consistência mesmo em falhas de webhook

---

## Estrutura do Projeto

app/
├── layout.tsx
├── page.tsx
├── products/
│   ├── page.tsx
│   └── [slug]/
│       ├── page.tsx
│       ├── product-detail-client.tsx
│       └── not-found.tsx
├── api/
│   ├── categories/
│   └── revalidate/
components/
├── home/
├── layout/
├── product/
└── ui/
lib/
├── api.ts
├── types.ts
└── utils.ts

---

## SEO

- Renderização server-side (SSR)
- generateMetadata dinâmico por produto
- Open Graph configurado (imagem, título, descrição)
- Estrutura semântica HTML
- Suporte a locale pt-BR
- Otimização mobile-first

---

## Tecnologias

- Next.js 15 (App Router, SSR, ISR)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide Icons

---

## Configuração

### Variáveis de ambiente

Criar arquivo `.env`:

NEXT_PUBLIC_API_URL=http://localhost:8080
REVALIDATE_SECRET=seu-secret-aqui

O segredo deve ser o mesmo configurado no backend.

---

## Execução

Instalar dependências:

npm install

Rodar em desenvolvimento:

npm run dev

Build de produção:

npm run build

Iniciar produção:

npm run start

---

## Integração com o Ecossistema

Este projeto faz parte de um sistema completo de e-commerce:

- Backend ERP: gerenciamento de catálogo, estoque e preços
- Painel administrativo: operação interna
- Loja virtual: vitrine pública (este projeto)

Para detalhes da arquitetura backend, consulte o repositório principal.
