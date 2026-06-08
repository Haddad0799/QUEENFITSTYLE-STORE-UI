import { NextRequest, NextResponse } from 'next/server'
import { createStoreOrder, ErpClientError } from '@/src/lib/erpClient'
import type { CreateOrderInput } from '@/src/types/order.types'

export async function POST(req: NextRequest) {
  let body: CreateOrderInput

  try {
    body = (await req.json()) as CreateOrderInput
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const order = await createStoreOrder(body)
    return NextResponse.json(order)
  } catch (error) {
    console.error(
      '[orders/create] falha ao criar pedido',
      JSON.stringify(
        {
          status: error instanceof ErpClientError ? error.statusCode : undefined,
          body: error instanceof ErpClientError ? error.body : undefined,
          message: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    )

    if (error instanceof ErpClientError) {
      return NextResponse.json(
        error.body ?? { error: 'Falha ao criar pedido' },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
