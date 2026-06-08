import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// Lê um valor mutável em memória, então o GET nunca pode ser cacheado.
export const dynamic = 'force-dynamic'

// Timestamp da última revalidação — em memória no processo Node. Suficiente para
// o caso de uso: ao reiniciar o processo (ou em outra instância), o frontend no
// máximo faz um refresh desnecessário na primeira checagem (inofensivo).
let lastRevalidatedAt = 0

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()
  const tags: string[] = body.tags

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json(
      { message: 'Tags array is required' },
      { status: 400 },
    )
  }

  for (const tag of tags) {
    revalidateTag(tag)
  }

  // marca o instante da revalidação para o frontend detectar via GET
  lastRevalidatedAt = Date.now()

  return NextResponse.json({ revalidated: true, tags })
}

// Endpoint público (sem secret) que o frontend consulta para saber se houve
// revalidação. Retorna apenas um número, nenhuma informação sensível.
export async function GET() {
  return NextResponse.json({ lastRevalidatedAt })
}
