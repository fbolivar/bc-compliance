import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BC Compliance - GRC & SecOps Platform',
  description: 'Plataforma unificada de ciberseguridad técnica y cumplimiento normativo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
