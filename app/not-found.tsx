import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-serif font-medium text-foreground">
        Página não encontrada
      </h1>
      <p className="mx-auto mb-8 max-w-md text-muted-foreground">
        Não conseguimos encontrar o conteúdo que você procurou. Você pode voltar para a home
        ou continuar navegando pelo catálogo.
      </p>
      <div className="flex justify-center">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
