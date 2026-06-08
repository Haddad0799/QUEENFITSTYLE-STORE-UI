import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>
}) {
  const { pedido } = await searchParams

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        Pedido confirmado!
      </h1>

      {pedido && (
        <p className="mt-2 text-sm text-muted-foreground">
          Pedido <span className="font-mono text-foreground">#{pedido}</span>
        </p>
      )}

      <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
        Recebemos a confirmação do seu pedido. Em breve nossa equipe entrará em
        contato pelo WhatsApp para combinar o pagamento e a entrega.
      </p>

      <Button asChild size="lg" className="mt-8">
        <Link href="/">Voltar à loja</Link>
      </Button>
    </main>
  )
}
