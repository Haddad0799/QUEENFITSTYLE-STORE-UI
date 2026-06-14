import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { getCategories } from '@/lib/api'
import { getStoreWhatsAppLinks } from '@/lib/whatsapp'

const INSTAGRAM_URL = 'https://www.instagram.com/queen_fitstyle?igsh=MnZud3pmeHg1OGd0'

type FooterLink = { label: string; href: string }

const companyLinks: FooterLink[] = [{ label: 'Sobre Nós', href: '#' }]

export async function Footer() {
  // Categorias e número de WhatsApp vêm de fontes que podem falhar; ambas
  // degradam para um fallback seguro sem quebrar a renderização do footer.
  const [categories, whatsappLinks] = await Promise.all([
    getCategories().catch(() => []),
    getStoreWhatsAppLinks(),
  ])

  const shopLinks: FooterLink[] = categories.map((c) => ({
    label: c.name,
    href: `/products?category=${c.slug}`,
  }))

  // Os links de WhatsApp só entram quando há número configurado; sem ele,
  // mostramos apenas o FAQ (em vez de links wa.me sem destinatário).
  const supportLinks: FooterLink[] = [
    whatsappLinks.contact && { label: 'Contato', href: whatsappLinks.contact },
    whatsappLinks.return && { label: 'Trocas e Devoluções', href: whatsappLinks.return },
    whatsappLinks.tracking && { label: 'Rastreamento', href: whatsappLinks.tracking },
    { label: 'FAQ', href: '#' },
  ].filter((link): link is FooterLink => Boolean(link))

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-semibold tracking-[0.32em] text-foreground">
                QUEENFITSTYLE
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Roupas fitness femininas para mulheres que buscam performance e estilo.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Comprar</h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Suporte</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('https') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} QUEENFITSTYLE. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="#"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Termos de Uso
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
