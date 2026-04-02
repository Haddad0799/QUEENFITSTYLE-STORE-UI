'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Aqui você pode adicionar a lógica de envio para sua API
      setIsSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
            Newsletter
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
            Fique por Dentro
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Cadastre-se para receber novidades, lançamentos exclusivos e ofertas especiais diretamente no seu e-mail.
          </p>

          {isSubmitted ? (
            <div className="flex items-center justify-center gap-2 text-accent">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Obrigado por se cadastrar!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">
                Cadastrar
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Ao se cadastrar, você concorda com nossa Política de Privacidade.
          </p>
        </div>
      </div>
    </section>
  )
}
