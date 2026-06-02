import { NextRequest, NextResponse } from 'next/server'
import { confirmReservation } from '@/src/lib/erpClient'

type ConfirmRequestBody = {
  reservationId?: unknown
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

export async function POST(req: NextRequest) {
  let body: ConfirmRequestBody

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
    await confirmReservation(reservationId)
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}
