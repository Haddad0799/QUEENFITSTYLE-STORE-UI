import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: {
    default: 'QueenFitStyle | Roupas Fitness Femininas',
    template: '%s | QueenFitStyle',
  },
  description: 'Descubra nossa coleção de roupas fitness femininas. Leggings, tops, shorts e muito mais com qualidade premium e estilo único.',
  keywords: ['fitness', 'roupas femininas', 'leggings', 'academia', 'moda fitness'],
  authors: [{ name: 'QueenFitStyle' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'QueenFitStyle',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f0f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
