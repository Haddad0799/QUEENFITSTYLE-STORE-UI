import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET() {
  const response = await fetch(`${API_BASE_URL}/store/categories`, {
    next: { tags: ['catalog-categories'], revalidate: 300 },
  })

  if (!response.ok) {
    return NextResponse.json([], { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
