import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-serif font-medium text-foreground mb-4">
        Produto não encontrado
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Desculpe, não conseguimos encontrar o produto que você está procurando. 
        Ele pode ter sido removido ou o link pode estar incorreto.
      </p>
      <Button asChild>
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Produtos
        </Link>
      </Button>
    </div>
  )
}
