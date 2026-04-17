import { NextResponse } from 'next/server'
import { normalizeCategoryTree } from '@/lib/category-tree-normalizer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const CATEGORY_ENDPOINT = `${API_BASE_URL}/store/catalog/categories`

export async function GET() {
  try {
    const response = await fetch(CATEGORY_ENDPOINT, {
      next: { tags: ['catalog-categories'], revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json([], { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(normalizeCategoryTree(data))
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
