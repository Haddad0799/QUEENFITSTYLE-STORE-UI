import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const CATEGORY_ENDPOINTS = [`${API_BASE_URL}/erp/categories`, `${API_BASE_URL}/store/categories`]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tree = searchParams.get('tree')
  const suffix = tree === 'true' ? '/tree' : ''
  let lastStatus = 500

  for (const endpoint of CATEGORY_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}${suffix}`, {
        next: { tags: ['catalog-categories'], revalidate: 300 },
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }

      lastStatus = response.status

      if (response.status !== 404) {
        return NextResponse.json([], { status: response.status })
      }
    } catch {
      lastStatus = 500
    }
  }

  return NextResponse.json([], { status: lastStatus })
}
