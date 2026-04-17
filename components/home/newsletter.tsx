'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Aqui você pode adicionar a lógica de envio para sua API.
      setIsSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-sm uppercase tracking-widest text-muted-foreground">
            Newsletter
          </p>
          <h2 className="mb-4 text-3xl font-serif font-medium text-foreground md:text-4xl">
            Fique por Dentro
          </h2>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Cadastre-se para receber novidades, lançamentos exclusivos e ofertas especiais
            diretamente no seu e-mail.
          </p>

          {isSubmitted ? (
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Obrigado por se cadastrar!</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">Cadastrar</Button>
            </form>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Ao se cadastrar, você concorda com nossa Política de Privacidade.
          </p>
        </div>
      </div>
    </section>
  )
}
