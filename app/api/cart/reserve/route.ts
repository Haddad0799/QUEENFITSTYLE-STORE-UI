import { NextRequest, NextResponse } from 'next/server'
import { ErpClientError, reserveStock } from '@/src/lib/erpClient'

type ReserveRequestBody = {
  skuCode?: unknown
  quantity?: unknown
}

export async function POST(req: NextRequest) {
  let body: ReserveRequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { skuCode, quantity } = body

  const isValidSkuCode = typeof skuCode === 'string' && skuCode.trim().length > 0
  const isValidQuantity = typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0

  if (!isValidSkuCode || !isValidQuantity) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const reservation = await reserveStock(skuCode, quantity)
    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    if (error instanceof ErpClientError && error.statusCode === 409) {
      return NextResponse.json(
        { error: 'Produto sem estoque disponível' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
