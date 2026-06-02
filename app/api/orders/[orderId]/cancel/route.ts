import { NextRequest, NextResponse } from 'next/server'
import { cancelOrderErp, ErpClientError } from '@/src/lib/erpClient'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId: orderIdParam } = await params
  const orderId = Number(orderIdParam)

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 })
  }

  try {
    await cancelOrderErp(orderId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[cancel-order] erro:', error)

    if (
      error instanceof ErpClientError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}