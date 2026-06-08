import { NextRequest, NextResponse } from 'next/server'
import { ErpClientError, releaseReservation } from '@/src/lib/erpClient'

type ReleaseRequestBody = {
  reservationId?: unknown
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

export async function POST(req: NextRequest) {
  let body: ReleaseRequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { reservationId } = body

  if (!isUuid(reservationId)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    await releaseReservation(reservationId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    // Reserva inexistente/já liberada: repassa o status para o cliente tratar
    // como "já liberada" (release best-effort, sem ruído na UI).
    if (
      error instanceof ErpClientError &&
      (error.statusCode === 404 || error.statusCode === 410)
    ) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: error.statusCode }
      )
    }

    console.error('[cart/release] falha ao liberar reserva', {
      reservationId,
      status: error instanceof ErpClientError ? error.statusCode : undefined,
      error,
    })

    if (error instanceof ErpClientError) {
      return NextResponse.json(
        { error: 'Falha ao liberar a reserva' },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
