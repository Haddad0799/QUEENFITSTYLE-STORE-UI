import { NextRequest, NextResponse } from 'next/server'
import { ErpClientError, getOrderStatusErp } from '@/src/lib/erpClient'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId: orderIdParam } = await params
  const orderId = Number(orderIdParam)

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 })
  }

  try {
    const status = await getOrderStatusErp(orderId)
    return NextResponse.json({ status })
  } catch (error) {
    console.error('[order-status] erro:', error)

    if (error instanceof ErpClientError) {
      // Repassa o status original do ERP (ex.: 404 quando o pedido não existe).
      return NextResponse.json(
        { error: `Falha ao consultar status do pedido ${orderId}` },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
